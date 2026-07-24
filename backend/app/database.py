from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Initialize MongoDB client using centralized settings
client = AsyncIOMotorClient(settings.MONGO_URL)
db = client.get_default_database() # or use setting for db name if needed

def get_db():
    return db