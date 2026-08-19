import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import auth, checkout

load_dotenv()

# Ensure tables exist in database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OTP-Based User Recognition & Checkout API",
    description="Full-stack FastAPI REST backend supporting OTP user recognition, authentication, and guest/user checkout.",
    version="1.0.0"
)

# CORS setup
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(checkout.router)

# Alias endpoints for direct assignment URL compatibility
@app.post("/register", tags=["Aliases"], status_code=201)
def register_alias(user_in: auth.UserRegister, db=Depends(auth.get_db)):
    return auth.register(user_in, db)

@app.get("/recognize", tags=["Aliases"])
@app.get("/api/users/recognize", tags=["Aliases"])
def recognize_alias(email: str = auth.Query(...), db=Depends(auth.get_db)):
    return auth.recognize(email, db)

@app.post("/verify-otp", tags=["Aliases"])
def verify_otp_alias(credentials: auth.LoginRequest, db=Depends(auth.get_db)):
    return auth.login(credentials, db)

@app.post("/resend-otp", tags=["Aliases"])
def resend_otp_alias(request_in: auth.ResendOtpRequest, db=Depends(auth.get_db)):
    return auth.resend_otp(request_in, db)

@app.get("/orders", tags=["Aliases"])
def orders_alias(current_user=Depends(auth.get_current_user), db=Depends(auth.get_db)):
    return auth.get_my_orders(current_user, db)

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}

