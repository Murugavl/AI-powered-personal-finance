from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db_indexes
from app.routes.transactions import router as transactions_router
from app.routes.accounts import router as accounts_router
from app.routes.bill_upload import router as bill_upload_router
from app.routes.budgets import router as budgets_router
from app.routes.export import router as export_router
from app.routes.auth import router as auth_router
from app.routes.chatbot import router as chatbot_router
from app.routes.alerts import router as alerts_router
from app.routes.goals import router as goals_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB indexes on startup
    await init_db_indexes()
    yield

app = FastAPI(title="Finance App API", version="2.0.0", lifespan=lifespan)

import os
from fastapi.staticfiles import StaticFiles

os.makedirs(os.path.join("uploads", "receipts"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Parse allowed origins from environment (comma-separated string)
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip() and origin.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

# Include all routers
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(accounts_router)
app.include_router(bill_upload_router)  
app.include_router(budgets_router) 
app.include_router(export_router) 
app.include_router(chatbot_router)
app.include_router(alerts_router)
app.include_router(goals_router)

@app.get("/")
async def home():
    return {"message": "Finance App API v2.0 is running!"}
