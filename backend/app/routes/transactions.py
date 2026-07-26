import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.auth import get_current_user
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# Create a FastAPI router
router = APIRouter(prefix="/transactions", tags=["Transactions"])

# Define Pydantic model for transaction validation
class TransactionSchema(BaseModel):
    amount: float
    date: datetime
    description: str
    category: str
    isRecurring: bool = False
    recurrence_rule: str = "none"  # "none", "weekly", "monthly", "yearly"
    type: str  # e.g., "income" or "expense"

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}


async def process_user_recurring_transactions(db: AsyncIOMotorDatabase, user_id: str) -> int:
    """Find recurring master transactions and generate due next occurrences."""
    now = datetime.now()
    cursor = db.transactions.find({
        "user_id": user_id,
        "recurrence_rule": {"$in": ["weekly", "monthly", "yearly"]}
    })
    masters = await cursor.to_list(length=200)

    generated_count = 0
    for master in masters:
        rule = master.get("recurrence_rule", "none")
        last_gen = master.get("last_recurring_generated") or master["date"]
        if isinstance(last_gen, str):
            try:
                last_gen = datetime.fromisoformat(last_gen)
            except Exception:
                last_gen = master["date"]

        if rule == "weekly":
            next_date = last_gen + timedelta(weeks=1)
        elif rule == "monthly":
            next_date = last_gen + relativedelta(months=1)
        elif rule == "yearly":
            next_date = last_gen + relativedelta(years=1)
        else:
            continue

        if next_date <= now:
            master_id_str = str(master["_id"])
            existing = await db.transactions.find_one({
                "user_id": user_id,
                "recurring_parent_id": master_id_str,
                "date": next_date
            })
            if not existing:
                new_txn = {
                    "user_id": user_id,
                    "amount": master["amount"],
                    "category": master["category"],
                    "description": f"{master['description']} (Recurring)",
                    "type": master["type"],
                    "date": next_date,
                    "recurrence_rule": "none",
                    "recurring_parent_id": master_id_str,
                    "isRecurring": True
                }
                await db.transactions.insert_one(new_txn)
                if master["type"] == "expense":
                    await db.budgets.update_one(
                        {"category": master["category"], "user_id": user_id},
                        {"$inc": {"spent": master["amount"]}}
                    )
                await db.transactions.update_one(
                    {"_id": master["_id"]},
                    {"$set": {"last_recurring_generated": next_date}}
                )
                generated_count += 1

    return generated_count


@router.post("/process-recurring")
async def process_recurring(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Trigger generation of due recurring transactions for the current user."""
    try:
        count = await process_user_recurring_transactions(db, user_id)
        return {"message": "Processed recurring transactions", "generated": count}
    except Exception as e:
        logger.exception("Error processing recurring transactions")
        raise HTTPException(status_code=500, detail="An error occurred while processing recurring transactions.")


from app.routes.budgets import check_and_create_budget_alert

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
            await db.budgets.update_one(
                {"category": transaction.category, "user_id": user_id}, 
                {"$inc": {"spent": transaction.amount}}
            )
            await check_and_create_budget_alert(db, user_id, transaction.category)

        # Insert Transaction with user_id
        txn_data = transaction.dict()
        txn_data["user_id"] = user_id
        if txn_data.get("recurrence_rule") != "none":
            txn_data["isRecurring"] = True
            txn_data["last_recurring_generated"] = txn_data["date"]
        await db.transactions.insert_one(txn_data)
        
        return {"message": "Transaction added and budget updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error adding transaction")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

# **2️ API to Fetch Transactions with Pagination & Filters**
@router.get("/")
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        # Auto-process due recurring items on fetch
        await process_user_recurring_transactions(db, user_id)

        query: dict = {"user_id": user_id}
        if category and category.strip() and category.lower() != "all":
            query["category"] = {"$regex": f"^{category.strip()}$", "$options": "i"}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["date"] = date_filter

        total = await db.transactions.count_documents(query)
        transactions_cursor = db.transactions.find(query).sort("date", -1).skip(skip).limit(limit)
        transactions = await transactions_cursor.to_list(length=limit)

        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
            transaction["category"] = transaction.get("category", "Unknown")

        return {
            "items": transactions,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching transactions")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

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
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid transaction ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching transaction {transaction_id}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

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
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid transaction ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting transaction {transaction_id}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

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
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid transaction ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating transaction {transaction_id}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")
