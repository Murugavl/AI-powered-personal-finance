import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.database import get_db
from app.models import Budget
from app.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/budgets", tags=["budgets"])

class UpdateSpentRequest(BaseModel):
    category: str
    amount: float

@router.post("/")
async def add_budget(
    budget: Budget,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Add a new budget."""
    try:
        budget_data = budget.dict()
        budget_data["category"] = budget_data["category"].strip().lower()
        budget_data["user_id"] = user_id
        await db["budgets"].insert_one(budget_data)
        return {"message": "Budget added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error adding budget")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

@router.get("/")
async def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get budgets for the current user with pagination."""
    try:
        total = await db["budgets"].count_documents({"user_id": user_id})
        budgets_cursor = db["budgets"].find({"user_id": user_id}).skip(skip).limit(limit)
        budgets = await budgets_cursor.to_list(length=limit)
        for budget in budgets:
            budget["_id"] = str(budget["_id"])
        return {
            "items": budgets,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching budgets")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

@router.delete("/{category}")
async def delete_budget(
    category: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Delete a budget by category."""
    try:
        result = await db["budgets"].delete_one({"category": category.lower(), "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Budget not found for category '{category}'.")
        return {"message": "Budget deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting budget for {category}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

from datetime import datetime

async def check_and_create_budget_alert(db: AsyncIOMotorDatabase, user_id: str, category: str):
    """Check if category spent exceeds budget and insert an alert if breached."""
    cat_lower = category.strip().lower()
    budget_doc = await db.budgets.find_one({
        "category": {"$regex": f"^{cat_lower}$", "$options": "i"},
        "user_id": user_id
    })
    if not budget_doc:
        return

    spent = budget_doc.get("spent", 0.0)
    target = budget_doc.get("budget", 0.0)

    if target > 0 and spent > target:
        existing_alert = await db.alerts.find_one({
            "user_id": user_id,
            "category": budget_doc["category"],
            "read": False
        })
        if not existing_alert:
            alert_doc = {
                "user_id": user_id,
                "category": budget_doc["category"],
                "budget": target,
                "spent": spent,
                "message": f"Budget limit breached for '{budget_doc['category'].capitalize()}'! Spent ₹{spent:,.2f} of ₹{target:,.2f} limit.",
                "created_at": datetime.utcnow(),
                "read": False
            }
            await db.alerts.insert_one(alert_doc)
            logger.warning(f"Inserted budget breach alert for user {user_id[:8]}, category {cat_lower}")


@router.put("/{category}")
async def update_budget(
    category: str,
    spent: float,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update a budget's spent amount."""
    try:
        category_lower = category.strip().lower()
        budget = await db["budgets"].find_one({"category": category_lower, "user_id": user_id})
        if not budget:
            raise HTTPException(status_code=404, detail=f"Budget not found for category '{category}'.")
        new_spent = budget["spent"] + spent
        await db["budgets"].update_one(
            {"category": category_lower, "user_id": user_id},
            {"$set": {"spent": new_spent}}
        )
        await check_and_create_budget_alert(db, user_id, category_lower)
        return {"message": "Budget updated successfully", "category": category, "new_spent": new_spent}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating budget for {category}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

@router.post("/update_spent/")
async def update_spent(
    request: UpdateSpentRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update spent amount when a new transaction is added."""
    try:
        budget = await db["budgets"].find_one({
            "category": {"$regex": f"^{request.category}$", "$options": "i"},
            "user_id": user_id
        })
        if not budget:
            return {"message": f"No budget found for category '{request.category}'. Skipping budget update."}

        result = await db["budgets"].update_one(
            {"category": {"$regex": f"^{request.category}$", "$options": "i"}, "user_id": user_id},
            {"$inc": {"spent": request.amount}}
        )
        await check_and_create_budget_alert(db, user_id, request.category)
        updated_budget = await db["budgets"].find_one({
            "category": {"$regex": f"^{request.category}$", "$options": "i"},
            "user_id": user_id
        })
        return {
            "message": "Spent amount updated successfully",
            "category": updated_budget["category"],
            "new_spent": updated_budget["spent"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating spent for category {request.category}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")
