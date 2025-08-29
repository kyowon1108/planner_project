from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class EmailVerificationCreate(BaseModel):
    email: EmailStr

class EmailVerificationVerify(BaseModel):
    email: EmailStr
    verification_code: str

class EmailVerificationResponse(BaseModel):
    message: str
    email: str

class EmailVerificationStatus(BaseModel):
    is_verified: bool
    email: str 