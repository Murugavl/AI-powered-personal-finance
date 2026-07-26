from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.database import get_db
from app.models import Budget
from app.auth import get_current_user

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException, Depends, Query

@router.get("/")
async def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Get budgets for the current user with pagination."""
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

@router.delete("/{category}")
async def delete_budget(
    category: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Delete a budget by category."""
    result = await db["budgets"].delete_one({"category": category.lower(), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Budget not found for category '{category}'.")
    return {"message": "Budget deleted successfully"}

@router.put("/{category}")
async def update_budget(
    category: str,
    spent: float,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update a budget's spent amount."""
    category_lower = category.strip().lower()
    budget = await db["budgets"].find_one({"category": category_lower, "user_id": user_id})
    if not budget:
        raise HTTPException(status_code=404, detail=f"Budget not found for category '{category}'.")
    new_spent = budget["spent"] + spent
    await db["budgets"].update_one(
        {"category": category_lower, "user_id": user_id},
        {"$set": {"spent": new_spent}}
    )
    return {"message": "Budget updated successfully", "category": category, "new_spent": new_spent}

@router.post("/update_spent/")
async def update_spent(
    request: UpdateSpentRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update spent amount when a new transaction is added."""
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
    updated_budget = await db["budgets"].find_one({
        "category": {"$regex": f"^{request.category}$", "$options": "i"},
        "user_id": user_id
    })
    return {
        "message": "Spent amount updated successfully",
        "category": updated_budget["category"],
        "new_spent": updated_budget["spent"]
    }
