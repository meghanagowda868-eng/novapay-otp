from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RegisterResponse(BaseModel):
    message: str
    user: UserResponse
    otp: str
    expires_in_minutes: int

class RecognizeResponse(BaseModel):
    registered: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit numeric OTP code")

class ResendOtpRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CheckoutRequest(BaseModel):
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=20, description="Phone number")
    shipping_address: str = Field(..., min_length=5, description="Full shipping address")

class CheckoutResponse(BaseModel):
    message: str
    order_reference: str
    user_id: Optional[int] = None
    email: EmailStr
    phone: str
    shipping_address: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    order_reference: str
    user_id: Optional[int] = None
    email: EmailStr
    phone: str
    shipping_address: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

