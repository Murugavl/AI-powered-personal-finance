from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models import Account
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/accounts", tags=["Accounts"])

# Create Account
@router.post("/", response_model=Account)
async def create_account(account: Account, db: AsyncIOMotorDatabase = Depends(get_db)):
    account_dict = account.dict()
    result = await db.accounts.insert_one(account_dict)
    account_dict["_id"] = str(result.inserted_id)  # Convert ObjectId to string
    return account_dict

#  Get All Accounts
@router.get("/", response_model=List[Account])
async def get_accounts(db: AsyncIOMotorDatabase = Depends(get_db)):
    accounts = await db.accounts.find().to_list(100)
    for account in accounts:
        account["_id"] = str(account["_id"])  # Convert ObjectId to string
    return accounts

#  Get Single Account by ID
@router.get("/{account_id}", response_model=Account)
async def get_account(account_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    account = await db.accounts.find_one({"_id": ObjectId(account_id)})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account["_id"] = str(account["_id"])
    return account

# Delete Account by ID
@router.delete("/{account_id}")
async def delete_account(account_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    result = await db.accounts.delete_one({"_id": ObjectId(account_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}
