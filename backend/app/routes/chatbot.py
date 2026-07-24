import os
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
async def chat_endpoint(
    req: ChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    msg = req.message.strip()
    if not msg:
        return {"reply": "Please type a message or ask a question!"}

    # Fetch user data to provide rich context to Gemini AI
    transactions = await db.transactions.find({"user_id": user_id}).to_list(100)
    accounts = await db.accounts.find({"user_id": user_id}).to_list(50)
    budgets = await db.budgets.find({"user_id": user_id}).to_list(50)

    total_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in transactions if t.get("type") == "expense")
    total_balance = sum(a.get("balance", 0) for a in accounts)

    cat_expenses = {}
    for t in transactions:
        if t.get("type") == "expense":
            c = t.get("category", "other").capitalize()
            cat_expenses[c] = cat_expenses.get(c, 0) + t.get("amount", 0)

    top_category = max(cat_expenses.items(), key=lambda x: x[1])[0] if cat_expenses else "N/A"

    system_context = f"""You are FinanceAI, an expert, helpful, and friendly AI personal finance assistant.
User Financial Profile:
- Total Balance: ₹{total_balance:,.2f}
- Total Income: ₹{total_income:,.2f}
- Total Expenses: ₹{total_expense:,.2f}
- Net Savings: ₹{(total_income - total_expense):,.2f}
- Accounts Count: {len(accounts)}
- Top Expense Category: {top_category}
- Active Budgets Count: {len(budgets)}

Provide a clear, engaging, concise (2-4 sentences max), and accurate response to the user's input.
Use formatting, bullet points, or emojis where appropriate.
If asked general financial or budgeting questions, answer intelligently with financial advice while acknowledging their current profile where relevant."""

    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    # Try Gemini 1.5 Flash / Gemini Pro API call
    if api_key:
        models_to_try = ["gemini-1.5-flash", "gemini-pro"]
        for model in models_to_try:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                        json={
                            "contents": [
                                {
                                    "role": "user",
                                    "parts": [{"text": f"{system_context}\n\nUser Question: {msg}"}]
                                }
                            ],
                            "generationConfig": {
                                "temperature": 0.7,
                                "maxOutputTokens": 300
                            }
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                return {"reply": parts[0]["text"].strip()}
            except Exception as e:
                logger.warning(f"Gemini API call to {model} failed: {e}")

    # Smart Fallback AI Response if network/key issues
    msg_lower = msg.lower()
    if "finance" in msg_lower or "what is" in msg_lower or "explain" in msg_lower:
        return {"reply": f"Personal finance is the management of your money, budgeting, investments, and savings! 💡 Right now, your net savings stand at ₹{(total_income - total_expense):,.2f} with total expenses of ₹{total_expense:,.2f}."}
    elif "balance" in msg_lower or "money" in msg_lower:
        return {"reply": f"Your current account balance is ₹{total_balance:,.2f} across {len(accounts)} account(s)."}
    elif "income" in msg_lower:
        return {"reply": f"Your total recorded income is ₹{total_income:,.2f}."}
    elif "expense" in msg_lower or "spent" in msg_lower:
        return {"reply": f"Your total expenses are ₹{total_expense:,.2f}. Your highest spending category is {top_category}."}
    else:
        return {"reply": f"Hello! 👋 As your FinanceAI assistant, I'm here to help you manage your ₹{total_balance:,.2f} balance, analyze your spending (₹{total_expense:,.2f}), set budgets, and give financial tips!"}
