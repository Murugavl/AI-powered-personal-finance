from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
import bcrypt
from bson import ObjectId

from app.database import get_db
from app.models import UserCreate, UserLogin, UserResponse
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    # Truncate to 72 bytes max as per bcrypt spec
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Hash password and create user
    hashed_pw = hash_password(user_data.password)
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_pw,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate token
    token = create_access_token(user_id, user_data.email)

    return UserResponse(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        token=token,
    )


@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login with email and password."""
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["email"])

    return UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        token=token,
    )


@router.get("/me")
async def get_me(db: AsyncIOMotorDatabase = Depends(get_db), user_id: str = Depends(__import__('app.auth', fromlist=['get_current_user']).get_current_user)):
    """Get current user info."""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"id": str(user["_id"]), "username": user["username"], "email": user["email"]}
