from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_current_user
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

# Create a FastAPI router
router = APIRouter(prefix="/transactions", tags=["Transactions"])

# Define Pydantic model for transaction validation
class TransactionSchema(BaseModel):
    amount: float
    date: datetime
    description: str
    category: str
    isRecurring: bool = False
    type: str  # e.g., "income" or "expense"

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# **1️ API to Add a Transaction**
@router.post("/")  
async def add_transaction(
    transaction: TransactionSchema, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        # Atomic Budget Update using $inc
        if transaction.type == "expense":
            # Normalize category for matching if needed, though here we match exactly
            await db.budgets.update_one(
                {"category": transaction.category, "user_id": user_id}, 
                {"$inc": {"spent": transaction.amount}}
            )

        # Insert Transaction with user_id
        txn_data = transaction.dict()
        txn_data["user_id"] = user_id
        await db.transactions.insert_one(txn_data)
        
        return {"message": "Transaction added and budget updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **2️ API to Fetch All Transactions**
@router.get("/", response_model=List[dict])
async def get_transactions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        # Filter by user_id
        transactions_cursor = db.transactions.find({"user_id": user_id})
        transactions = await transactions_cursor.to_list(length=100)

        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
            transaction["category"] = transaction.get("category", "Unknown")

        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **3️ API to Get a Single Transaction by ID**
@router.get("/{transaction_id}", response_model=dict)
async def get_transaction(
    transaction_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        transaction = await db.transactions.find_one({
            "_id": ObjectId(transaction_id),
            "user_id": user_id
        })
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction["_id"] = str(transaction["_id"])
        return transaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **4️ API to Delete a Transaction**
@router.delete("/{transaction_id}", response_model=dict)
async def delete_transaction(
    transaction_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        result = await db.transactions.delete_one({
            "_id": ObjectId(transaction_id),
            "user_id": user_id
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# **5️ API to Update a Transaction**
@router.put("/{transaction_id}", response_model=dict)
async def update_transaction(
    transaction_id: str, 
    updated_data: TransactionSchema,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        txn_dict = updated_data.dict()
        txn_dict["user_id"] = user_id
        
        result = await db.transactions.update_one(
            {"_id": ObjectId(transaction_id), "user_id": user_id},
            {"$set": txn_dict}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return {"message": "Transaction updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
