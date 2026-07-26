from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

import logging

logger = logging.getLogger(__name__)

# Initialize MongoDB client using centralized settings
client = AsyncIOMotorClient(settings.MONGO_URL)
db = client.get_default_database() # or use setting for db name if needed

def get_db():
    return db

async def init_db_indexes():
    """Create essential MongoDB indexes idempotently on application startup."""
    try:
        # Transactions index: user_id + date descending
        await db.transactions.create_index([("user_id", 1), ("date", -1)], name="user_id_1_date_-1")
        # Accounts index: user_id
        await db.accounts.create_index([("user_id", 1)], name="user_id_1")
        # Budgets indexes: user_id and compound user_id + category
        await db.budgets.create_index([("user_id", 1)], name="user_id_1")
        await db.budgets.create_index([("user_id", 1), ("category", 1)], name="user_id_1_category_1")
        # Revoked tokens indexes: jti unique index & expires_at TTL auto-deletion
        await db.revoked_tokens.create_index([("jti", 1)], name="jti_1", unique=True)
        await db.revoked_tokens.create_index([("expires_at", 1)], name="expires_at_ttl", expireAfterSeconds=0)
        logger.info("MongoDB indexes initialized successfully.")
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}")