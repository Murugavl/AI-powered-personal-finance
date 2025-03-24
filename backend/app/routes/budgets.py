from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.database import get_db
from app.models import Budget

router = APIRouter(prefix="/budgets", tags=["budgets"])

#  Request model for updating spent amount
class UpdateSpentRequest(BaseModel):
    category: str
    amount: float

@router.post("/")
async def add_budget(budget: Budget, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Add a new budget."""
    try:
        budget_data = budget.dict()
        budget_data["category"] = budget_data["category"].strip().lower()  # Normalize category
        await db["budgets"].insert_one(budget_data)
        return {"message": "Budget added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_budgets(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all budgets."""
    budgets = await db["budgets"].find().to_list(None)

    # Convert ObjectId to string for JSON serialization
    for budget in budgets:
        budget["_id"] = str(budget["_id"])

    return budgets

@router.put("/{category}")
async def update_budget(category: str, spent: float, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update a budget's spent amount by adding new expenses."""
    category_lower = category.strip().lower()  # Normalize category name
    budget = await db["budgets"].find_one({"category": category_lower})

    if not budget:
        raise HTTPException(status_code=404, detail=f"Budget not found for category '{category}'.")

    new_spent = budget["spent"] + spent
    await db["budgets"].update_one({"category": category_lower}, {"$set": {"spent": new_spent}})

    return {"message": "Budget updated successfully", "category": category, "new_spent": new_spent}

@router.post("/update_spent/")
async def update_spent(request: UpdateSpentRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update spent amount when a new transaction is added."""
    budget = await db["budgets"].find_one({"category": {"$regex": f"^{request.category}$", "$options": "i"}})

    if not budget:
        raise HTTPException(status_code=404, detail=f"Budget not found for category '{request.category}'. "
                                                    "Ensure you have set a budget before adding expenses.")

    # Atomic update using `$inc`
    result = await db["budgets"].update_one(
        {"category": {"$regex": f"^{request.category}$", "$options": "i"}},
        {"$inc": {"spent": request.amount}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update spent amount.")

    updated_budget = await db["budgets"].find_one({"category": {"$regex": f"^{request.category}$", "$options": "i"}})

    return {
        "message": "Spent amount updated successfully",
        "category": updated_budget["category"],
        "new_spent": updated_budget["spent"]
    }
