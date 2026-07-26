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

from fastapi import APIRouter, HTTPException, Depends, Query

@router.get("/")
async def get_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    total = await db.accounts.count_documents({"user_id": user_id})
    accounts_cursor = db.accounts.find({"user_id": user_id}).skip(skip).limit(limit)
    accounts = await accounts_cursor.to_list(length=limit)
    for account in accounts:
        account["_id"] = str(account["_id"])
    return {
        "items": accounts,
        "total": total,
        "skip": skip,
        "limit": limit
    }

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
