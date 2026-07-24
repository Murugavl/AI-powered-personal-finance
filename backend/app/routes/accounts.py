from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.models import Account
from app.auth import get_current_user
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.post("/")
async def create_account(
    account: Account,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    account_dict = account.dict()
    account_dict["user_id"] = user_id
    result = await db.accounts.insert_one(account_dict)
    account_dict["_id"] = str(result.inserted_id)
    return account_dict

@router.get("/")
async def get_accounts(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    accounts = await db.accounts.find({"user_id": user_id}).to_list(100)
    for account in accounts:
        account["_id"] = str(account["_id"])
    return accounts

@router.get("/{account_id}")
async def get_account(
    account_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    account = await db.accounts.find_one({"_id": ObjectId(account_id), "user_id": user_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account["_id"] = str(account["_id"])
    return account

@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    result = await db.accounts.delete_one({"_id": ObjectId(account_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}
