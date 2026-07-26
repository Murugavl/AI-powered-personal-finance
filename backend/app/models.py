import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

# Transaction Model
class Transaction(BaseModel):
    type: str  # "income" or "expense"
    amount: float
    category: str
    date: datetime = datetime.now()
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    recurrence_rule: str = "none"  # "none", "weekly", "monthly", "yearly"

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

# User Models for custom auth
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    token: str