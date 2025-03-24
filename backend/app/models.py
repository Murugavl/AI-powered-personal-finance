from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Expense Model (already added)
class Expense(BaseModel):
    title: str
    amount: float
    category: str
    date: datetime = datetime.now()
    notes: Optional[str] = None

#  Transaction Model
class Transaction(BaseModel):
    type: str  # "income" or "expense"
    amount: float
    category: str
    date: datetime = datetime.now()
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class Account(BaseModel):
    id: Optional[str] = None
    name: str
    institution: str
    type: str  # "bank", "credit", "investment"
    balance: float

# Budget Model
class Budget(BaseModel):
    category: str
    budget: float
    spent: float = 0.0  # Default spent amount