import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_db
from app.auth import get_current_user
from app.models import Goal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/goals", tags=["Savings Goals"])


class DepositRequest(BaseModel):
    amount: float


@router.get("", response_model=None)
@router.get("/", response_model=None)
async def get_goals(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Fetch all savings goals for the logged-in user."""
    try:
        cursor = db.goals.find({"user_id": user_id}).sort("created_at", -1)
        goals = await cursor.to_list(length=100)

        for goal in goals:
            goal["_id"] = str(goal["_id"])
            target = goal.get("target_amount", 1.0)
            current = goal.get("current_amount", 0.0)
            goal["progress_percentage"] = min(100.0, round((current / target) * 100.0, 1)) if target > 0 else 0.0

        return goals
    except Exception as e:
        logger.exception("Error fetching savings goals")
        raise HTTPException(status_code=500, detail="An error occurred while fetching savings goals.")


@router.post("", response_model=None)
@router.post("/", response_model=None)
async def create_goal(
    goal: Goal,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Create a new savings goal."""
    try:
        goal_data = goal.dict()
        goal_data["user_id"] = user_id
        goal_data["created_at"] = datetime.utcnow()

        result = await db.goals.insert_one(goal_data)
        goal_data["_id"] = str(result.inserted_id)
        target = goal_data.get("target_amount", 1.0)
        current = goal_data.get("current_amount", 0.0)
        goal_data["progress_percentage"] = min(100.0, round((current / target) * 100.0, 1)) if target > 0 else 0.0

        return goal_data
    except Exception as e:
        logger.exception("Error creating savings goal")
        raise HTTPException(status_code=500, detail="An error occurred while creating the savings goal.")


@router.post("/{goal_id}/deposit")
async def deposit_to_goal(
    goal_id: str,
    deposit: DepositRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Add a deposit/contribution to a savings goal."""
    try:
        if deposit.amount <= 0:
            raise HTTPException(status_code=400, detail="Deposit amount must be greater than zero.")

        result = await db.goals.find_one_and_update(
            {"_id": ObjectId(goal_id), "user_id": user_id},
            {"$inc": {"current_amount": deposit.amount}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Savings goal not found.")

        result["_id"] = str(result["_id"])
        target = result.get("target_amount", 1.0)
        current = result.get("current_amount", 0.0)
        result["progress_percentage"] = min(100.0, round((current / target) * 100.0, 1)) if target > 0 else 0.0

        return {"message": "Deposit added successfully", "goal": result}
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error depositing to goal {goal_id}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the savings goal.")


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Delete a savings goal."""
    try:
        result = await db.goals.delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Savings goal not found.")
        return {"message": "Savings goal deleted successfully"}
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid goal ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting goal {goal_id}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting the savings goal.")
