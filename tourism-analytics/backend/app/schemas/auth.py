# backend/app/schemas/auth.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class LoginRequest(BaseModel):
    admin_password: str = Field(..., min_length=1)

class LoginResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None
    must_change_password: bool = True
    
class LogoutRequest(BaseModel):
    session_id: Optional[str] = None
    
class LogoutResponse(BaseModel):
    success: bool
    message: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class ChangePasswordResponse(BaseModel):
    success:bool=True
    message: str