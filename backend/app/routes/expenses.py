from fastapi import APIRouter, HTTPException
from app.database import db
from models import Expense
from bson import ObjectId
from typing import List

router = APIRouter()

# Get all expenses
@router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find().to_list(length=100)
    return expenses

# Add a new expense
@router.post("/expenses")
async def add_expense(expense: Expense):
    result = await db.expenses.insert_one(expense.dict())
    return {"message": "Expense added", "id": str(result.inserted_id)}

# Delete an expense
@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}
