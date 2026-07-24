from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.expenses import router as expenses_router
from app.routes.transactions import router as transactions_router  
from app.routes.accounts import router as accounts_router
from app.routes.bill_upload import router as bill_upload_router  
from app.routes.budgets import router as budgets_router 
from app.routes.export import router as export_router 
from app.routes.auth import router as auth_router
from app.routes.chatbot import router as chatbot_router

app = FastAPI(title="Finance App API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(transactions_router)
app.include_router(accounts_router)
app.include_router(bill_upload_router)  
app.include_router(budgets_router) 
app.include_router(export_router) 
app.include_router(chatbot_router)

@app.get("/")
async def home():
    return {"message": "Finance App API v2.0 is running!"}
