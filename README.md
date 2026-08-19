# NovaPay — OTP-Based User Recognition & Checkout Application

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg?style=flat&logo=mysql)](https://www.mysql.com/)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB.svg?style=flat&logo=python)](https://www.python.org/)

NovaPay is a production-quality, full-stack web application designed for a hiring assignment. It implements an intelligent **OTP-based user recognition** mechanism seamlessly integrated into an e-commerce checkout flow.

---

## 🌟 Architecture & High-Level Overview

The application follows a clean 3-tier architecture:

```text
React Frontend (Vite + React Router + React Hook Form + Vanilla CSS)
                          ↓ Axios REST Calls (Port 5173 -> Port 8000)
FastAPI Backend (Python + SQLAlchemy ORM + Pydantic + PyJWT)
                          ↓ PyMySQL / DB Connection (Port 8000 -> Port 3308)
MySQL 8+ Database (otp_checkout_db: users, checkout_orders)
```

The frontend **NEVER** connects directly to MySQL. All data operations strictly flow through the FastAPI REST layer.

---

## ✨ Features

- **Flow A — Registration & OTP Code Generation**:
  - Collects First Name, Last Name, and Email address.
  - Generates a random 6-digit numeric OTP valid for **5 minutes**.
  - Displays the generated 6-digit OTP code clearly on screen with a live countdown timer.
  - Direct navigation button to proceed to Checkout with pre-filled email.

- **Flow B — Real-Time User Recognition & Checkout**:
  - Checkout form fields: Email, Phone Number, Shipping Address.
  - **500ms Debounced Real-Time Recognition**: As the user types a valid email, `GET /auth/recognize?email=...` queries the backend asynchronously.
  - Non-blocking UI: The user can continue typing phone and address while recognition happens in the background.
  - **Recognition Status Badges**: Displays `Checking account...` or `✓ Existing account found`.

- **OTP Login Modal & Input UX**:
  - Automatic popup when an existing registered account is detected.
  - Segmented 6-digit input boxes supporting auto-focus, paste, backspace focus shifting, and numerical constraints.
  - Verify button disabled until all 6 digits are entered.
  - "Continue as guest" button: closes modal without authenticating, preserves checkout form values, and allows guest checkout.

- **3 Extra Features Included**:
  1. **OTP Expiration (5 Minutes)**: Enforces `otp_expires_at` timestamp. Expired OTP attempts are rejected with clear error feedback.
  2. **Resend OTP with 30-Second Cooldown**: Generates a new 6-digit OTP, invalidates old OTP, resets 5-minute expiry, enforced with a 30-second cooldown timer button (`Resend code in 30s`).
  3. **Unique Order Reference ID**: Generates custom reference ID (`ORD-20260817-XXXXX`) saved in MySQL and returned on checkout success.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React, JavaScript (JSX - No TypeScript), Vite, React Router DOM, Axios, React Hook Form, Vanilla CSS |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy ORM, PyJWT, PyMySQL, Uvicorn |
| **Database** | MySQL 8.0+ |
| **Testing** | Pytest, FastAPI TestClient, Httpx |

---

## 📁 Project Structure

```text
otp-login-app/
├── database/
│   └── schema.sql                  # Complete executable MySQL database schema
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py             # Auth endpoints (/register, /recognize, /login, /resend-otp, /me)
│   │   │   └── checkout.py         # Checkout endpoint (/checkout)
│   │   ├── services/
│   │   │   └── auth_service.py     # Business logic for OTP, registration, verification, resend
│   │   ├── models.py               # SQLAlchemy ORM models (User, CheckoutOrder)
│   │   ├── schemas.py              # Pydantic data schemas
│   │   ├── database.py             # SQLAlchemy engine & session maker
│   │   ├── security.py             # JWT & OTP generator utilities
│   │   ├── dependencies.py         # FastAPI DB session & auth dependencies
│   │   └── main.py                 # FastAPI application, CORS & /health
│   ├── tests/
│   │   ├── test_auth.py            # Pytest suite for auth endpoints & OTP rules
│   │   └── test_checkout.py        # Pytest suite for guest & authenticated checkout
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment configuration template
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── authApi.js          # Axios requests for auth endpoints
│   │   │   └── checkoutApi.js      # Axios requests for checkout endpoints
│   │   ├── components/
│   │   │   ├── Header.jsx          # Top navigation bar with user badge
│   │   │   ├── RegistrationForm.jsx# Registration form & OTP display card
│   │   │   ├── CheckoutForm.jsx    # Checkout form with real-time recognition
│   │   │   ├── OtpModal.jsx        # Polished 6-digit segmented OTP modal
│   │   │   └── Toast.jsx           # Notification toast component
│   │   ├── pages/
│   │   │   ├── Register.jsx        # Registration page container
│   │   │   └── Checkout.jsx        # Checkout page container
│   │   ├── hooks/
│   │   │   └── useDebounce.js      # Custom 500ms debounce hook
│   │   ├── utils/
│   │   │   └── validation.js       # Email & phone validation helpers
│   │   ├── index.css               # Vanilla CSS design system & tokens
│   │   ├── App.jsx                 # Main layout & router configuration
│   │   └── main.jsx                # React entrypoint
│   ├── package.json
│   └── .env.example
├── prompts.md                      # Master prompt & implementation prompt history
├── README.md                       # Comprehensive project documentation
└── .gitignore
```

---

## 🗄️ Database Schema (`database/schema.sql`)

```sql
CREATE DATABASE IF NOT EXISTS otp_checkout_db;
USE otp_checkout_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 2. Checkout Orders Table
CREATE TABLE IF NOT EXISTS checkout_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_reference VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_ref (order_reference),
    INDEX idx_order_email (email)
);
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint | N/A |
| `POST` | `/auth/register` | Register new user & generate OTP | `{"first_name", "last_name", "email"}` |
| `GET` | `/auth/recognize` | Check if email belongs to registered user | `?email=john@example.com` |
| `POST` | `/auth/login` | Login with 6-digit OTP | `{"email", "otp"}` |
| `POST` | `/auth/resend-otp` | Issue new OTP & reset 5-min timer | `{"email"}` |
| `GET` | `/auth/me` | Fetch authenticated user profile | Header: `Authorization: Bearer <token>` |
| `POST` | `/checkout` | Submit order (guest or authenticated) | `{"email", "phone", "shipping_address"}` |

---

## ⚙️ Environment Variables

### Backend `.env`
```env
DATABASE_URL=mysql+pymysql://root:@localhost:3308/otp_checkout_db
JWT_SECRET_KEY=otp_super_secret_jwt_key_2026_production_quality
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 💻 Local Setup & Execution Instructions

### 1. Database Setup (MySQL)
Execute `database/schema.sql` against your MySQL server:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Running Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Swagger API Documentation will be available at: `http://localhost:8000/docs`

### 3. Running Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Testing

Run automated pytest backend suite covering all API endpoints:
```bash
cd backend
$env:PYTHONPATH="." ; python -m pytest tests/
```

All 5 backend test suites test user registration, duplicate email handling, real-time recognition queries, OTP validation, 5-minute expiration rejection, OTP resend, guest checkout, and authenticated checkout.

---

## 🌐 Deployment Instructions

- **Frontend (Vercel / Netlify)**:
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variable: Set `VITE_API_BASE_URL` to your production FastAPI backend URL.

- **Backend (Render / Railway / AWS)**:
  - Root Directory: `backend`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Environment Variables: Set `DATABASE_URL`, `JWT_SECRET_KEY`, and `FRONTEND_URL`.

---

## 👥 GitHub Access
To share access with the hiring team:
1. Go to your GitHub repository.
2. Select **Settings** > **Collaborators**.
3. Click **Add people**.
4. Search for `boltapp-hiring` and invite them as a collaborator.

---

## 💡 How Checkout Flows Work

### Guest Checkout Flow
1. User enters email, phone number, and shipping address on the checkout form.
2. The user ignores the automatic recognition login modal (clicks "Skip for now").
3. Submitting the form posts checkout data to the backend `/checkout`.
4. The database records the checkout with `user_id` as `NULL`.

### Authenticated Checkout Flow
1. User enters a registered email on the checkout form.
2. Real-time recognition runs in the background. Once the complete email is detected, the OTP Login Modal pops up automatically greeting the user by name.
3. The user inputs their 6-digit login code.
4. On successful verification, the user is authenticated (JWT issued & saved in localStorage).
5. The checkout page displays "Authenticated as {First Name} {Last Name}" and automatically populates their email.
6. The user fills phone number & address and submits checkout, which associates the order with their registered `user_id`.

---

## 📋 Assignment Requirement Checklist

* [x] Registration collects email
* [x] Registration collects first name
* [x] Registration collects last name
* [x] Random 6-digit OTP generated
* [x] OTP displayed after registration
* [x] OTP expiry implemented
* [x] Checkout collects email
* [x] Checkout collects phone
* [x] Checkout collects shipping address
* [x] Real-time email validation
* [x] Background recognition API
* [x] Registered-user detection
* [x] OTP modal
* [x] Skip login option
* [x] OTP verification
* [x] Invalid OTP error
* [x] Expired OTP handling
* [x] Successful login
* [x] User name displayed after login
* [x] Guest checkout
* [x] Checkout saved to database
* [x] Order ID generated
* [x] No real payment processing
* [x] Separate frontend layer
* [x] Separate API layer
* [x] Separate database layer
* [x] SQL schema committed
* [x] prompts.md committed
* [x] README completed
* [x] Public deployment completed
* [x] GitHub access prepared for boltapp-hiring

