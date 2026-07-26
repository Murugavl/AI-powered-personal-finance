import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_db
from app.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=None)
@router.get("/", response_model=None)
async def get_alerts(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Fetch all notifications/alerts for current user."""
    try:
        unread_count = await db.alerts.count_documents({"user_id": user_id, "read": False})
        cursor = db.alerts.find({"user_id": user_id}).sort("created_at", -1).limit(50)
        alerts = await cursor.to_list(length=50)

        for alert in alerts:
            alert["_id"] = str(alert["_id"])
            if isinstance(alert.get("created_at"), datetime):
                alert["created_at"] = alert["created_at"].isoformat()

        return {
            "items": alerts,
            "unread_count": unread_count
        }
    except Exception as e:
        logger.exception("Error fetching alerts")
        raise HTTPException(status_code=500, detail="An error occurred while fetching notifications.")


@router.patch("/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Mark a specific alert as read."""
    try:
        result = await db.alerts.update_one(
            {"_id": ObjectId(alert_id), "user_id": user_id},
            {"$set": {"read": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found.")
        return {"message": "Alert marked as read"}
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid alert ID format.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error marking alert {alert_id} read")
        raise HTTPException(status_code=500, detail="An error occurred while updating the notification.")


@router.patch("/read-all")
async def mark_all_alerts_read(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Mark all unread alerts for the user as read."""
    try:
        await db.alerts.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True}}
        )
        return {"message": "All alerts marked as read"}
    except Exception as e:
        logger.exception("Error marking all alerts read")
        raise HTTPException(status_code=500, detail="An error occurred while updating notifications.")
