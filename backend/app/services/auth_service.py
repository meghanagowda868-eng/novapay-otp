from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import User
from app.schemas import UserRegister
from app.security import generate_otp, create_access_token

def register_user(db: Session, data: UserRegister):
    existing_user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    user = User(
        email=data.email.lower().strip(),
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        otp_code=otp,
        otp_expires_at=expires_at.replace(tzinfo=None),
        otp_attempts=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user, otp

def recognize_email(db: Session, email: str):
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if user:
        return True, user.first_name, user.last_name
    return False, None, None

def login_with_otp(db: Session, email: str, otp: str):
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or OTP code."
        )

    # Check attempt count limit (Max 5 attempts)
    if user.otp_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please click 'Resend code' to generate a new login code."
        )

    # Check OTP Expiration (5 minutes)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if user.otp_expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your login code has expired. Please request a new code."
        )

    # Check OTP Code
    if user.otp_code != otp.strip():
        user.otp_attempts += 1
        db.commit()
        remaining = 5 - user.otp_attempts
        if remaining > 0:
            msg = f"Invalid login code. {remaining} attempt(s) remaining."
        else:
            msg = "Too many failed attempts. Please click 'Resend code' to generate a new login code."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # Success: Reset attempts counter
    user.otp_attempts = 0
    db.commit()

    # Generate JWT token
    token = create_access_token(data={"sub": user.email, "id": user.id})
    return token, user

def resend_otp(db: Session, email: str):
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account with this email does not exist."
        )

    new_otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    user.otp_code = new_otp
    user.otp_expires_at = expires_at.replace(tzinfo=None)
    user.otp_attempts = 0
    db.commit()
    db.refresh(user)

    return new_otp

