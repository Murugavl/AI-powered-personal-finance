from fastapi import APIRouter, Depends, HTTPException
from app.database import db  # Ensure it imports the async MongoDB client
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Transaction
from motor.motor_asyncio import AsyncIOMotorDatabase

# Create a FastAPI router
router = APIRouter()

# Define Pydantic model for transaction validation
class Transaction(BaseModel):
    amount: float
    date: datetime
    description: str
    category: str
    isRecurring: bool = False
    type: str  #  Add this field (e.g., "income" or "expense")

    class Config:
        orm_mode = True
        json_encoders = {datetime: lambda v: v.isoformat()}  # Convert datetime to ISO format


# **1️ API to Add a Transaction**

@router.post("/transactions/")  
async def add_transaction(transaction: Transaction, db: AsyncIOMotorDatabase = Depends(get_db)):
    if transaction.type == "expense":
        budget = await db.budgets.find_one({"category": transaction.category})
        if budget:
            new_spent = budget["spent"] + transaction.amount
            await db.budgets.update_one({"category": transaction.category}, {"$set": {"spent": new_spent}})

    await db.transactions.insert_one(transaction.dict())
    return {"message": "Transaction added and budget updated"}


# **2️ API to Fetch All Transactions**
@router.get("/transactions/", response_model=List[dict])
async def get_transactions():
    try:
        transactions_cursor = db.transactions.find({})
        transactions = await transactions_cursor.to_list(length=100)

        # Ensure category is always included
        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])  # Convert ObjectId to string
            transaction["category"] = transaction.get("category", "Unknown")  # ✅ Ensure category exists

        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# **3️ API to Get a Single Transaction by ID**
@router.get("/transactions/{transaction_id}", response_model=dict)
async def get_transaction(transaction_id: str):
    try:
        transaction = await db.transactions.find_one({"_id": ObjectId(transaction_id)})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction["_id"] = str(transaction["_id"])  # Convert ObjectId to string
        return transaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **4️ API to Delete a Transaction**
@router.delete("/transactions/{transaction_id}", response_model=dict)
async def delete_transaction(transaction_id: str):
    try:
        result = await db.transactions.delete_one({"_id": ObjectId(transaction_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **5️ API to Update a Transaction**
@router.put("/transactions/{transaction_id}", response_model=dict)
async def update_transaction(transaction_id: str, updated_data: Transaction):
    try:
        result = await db.transactions.update_one(
            {"_id": ObjectId(transaction_id)},
            {"$set": updated_data.dict()}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return {"message": "Transaction updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
