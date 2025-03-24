import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client["AI_Finance"]  

def get_db():
    return db