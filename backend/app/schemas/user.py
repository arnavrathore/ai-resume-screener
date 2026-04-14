"""
schemas/user.py — Pydantic schemas for authentication.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Schema for registering a new HR user."""
    email: EmailStr
    full_name: str
    password: str
    role: str = "hr"


class UserLogin(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Public-facing user info (no password)."""
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    """Decoded JWT payload."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
