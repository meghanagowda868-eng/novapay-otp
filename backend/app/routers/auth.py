from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, CheckoutOrder
from app.schemas import (
    UserRegister,
    RegisterResponse,
    RecognizeResponse,
    LoginRequest,
    ResendOtpRequest,
    TokenResponse,
    UserResponse,
    OrderResponse,
)
from app.services import auth_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user, otp = auth_service.register_user(db, user_in)
    return RegisterResponse(
        message="Registration successful",
        user=UserResponse.model_validate(user),
        otp=otp,
        expires_in_minutes=5
    )

@router.get("/recognize", response_model=RecognizeResponse)
def recognize(email: str = Query(..., description="Email address to check"), db: Session = Depends(get_db)):
    is_registered, first_name, last_name = auth_service.recognize_email(db, email)
    return RecognizeResponse(
        registered=is_registered,
        first_name=first_name,
        last_name=last_name
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    token, user = auth_service.login_with_otp(db, credentials.email, credentials.otp)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/resend-otp")
def resend_otp(request_in: ResendOtpRequest, db: Session = Depends(get_db)):
    new_otp = auth_service.resend_otp(db, request_in.email)
    return {
        "message": "A new OTP code has been generated and sent.",
        "otp": new_otp,
        "expires_in_minutes": 5
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/orders", response_model=List[OrderResponse])
def get_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(CheckoutOrder).filter(CheckoutOrder.user_id == current_user.id).order_by(CheckoutOrder.created_at.desc()).all()
    return [OrderResponse.model_validate(o) for o in orders]

