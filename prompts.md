# Prompts History

This document records the master prompts and sequential execution prompts given to build and refine the OTP-Based User Recognition & Checkout Application.

---

## 🏗️ 1. Project Setup
```text
Initialize a 3-tier architecture workspace containing:
- React frontend (Vite, React Router, TailwindCSS/Vanilla CSS, Axios, React Hook Form)
- FastAPI backend (Python 3.13, PyJWT, SQLAlchemy ORM, PyMySQL)
- MySQL database schema
Configure basic package.json, requirements.txt, and directory structure.
```

---

## 📝 2. Registration Flow
```text
Build Flow A: User Registration.
Collect Email, First name, Last name.
Validate format on the frontend using React Hook Form, and on the backend using Pydantic.
Generate a random 6-digit numeric login code. Store it securely in the MySQL database with a 5-minute expiry.
On successful registration, display the Success Card containing:
- User's name
- 6-digit login code
- Live countdown timer (5 minutes)
- "Copy OTP" clipboard button
- "Continue to Checkout" navigation button
```

---

## 🔐 3. OTP Generation & Security
```text
Improve backend OTP implementation with:
- otp_attempts column in the User model to prevent brute-force (maximum 5 failed attempts per code)
- 5-minute expiry logic
- Resend OTP functionality reset attempts counter and renews the 5-minute expiry
- 30-second cooldown on the resend button to prevent API spamming
- Never log OTP values or expose OTP in recognize/error endpoint responses
- Server-side validation of OTP format, expiry, and attempts count
```

---

## 🛒 4. Checkout Flow
```text
Implement checkout form collecting email, phone number, and shipping address.
Support both Guest Checkout and Authenticated Checkout:
- If guest checkout (user skipped login or is unregistered), save the order reference with user_id = null.
- If authenticated checkout, auto-populate email and associate order with user_id.
Generate unique reference ORD-YYYYMMDD-XXXXX on the backend.
```

---

## 🔍 5. Real-Time Recognition
```text
Implement 500ms debounced real-time email recognition.
As the user types the email:
- If valid email, trigger background API recognize endpoint.
- If registered, show a check badge "Welcome back, {Name}" and auto-trigger the OTP Login Modal.
- If unregistered, show "No account found. Continue as guest".
The user must not be blocked from typing phone and shipping address while the recognition happens.
```

---

## 🔑 6. Authentication & Session State
```text
Store JWT access token and user info in localStorage upon successful OTP verification.
Ensure the header updates to show "Welcome, {First Name} {Last Name}" and a "Logout" button.
Re-validate token validity on frontend mount.
```

---

## 🗄️ 7. Database & SQL Schema
```text
Create `database/schema.sql` containing MySQL table structures:
- `users`: id, email (unique), first_name, last_name, otp_code, otp_expires_at, otp_attempts, created_at, updated_at
- `checkout_orders`: id, order_reference (unique), user_id (nullable FK), email, phone, shipping_address, created_at
Also create a `database/seed.sql` file to load a sample registered user and order for development testing.
```

---

## 🎨 8. UI/UX & Responsive Layouts
```text
Style the application with a premium dark glassmorphism theme using CSS variables, custom animations, transitions, and hover micro-animations.
Ensure complete responsiveness across:
- Desktop
- Tablet
- Mobile
Verify that the OTP Modal, Checkout Form, and Order Confirmation Card render correctly on small screens.
```

---

## 🧪 9. Automated Testing
```text
Create Pytest suites covering:
- Registration (successful, duplicates, invalid inputs)
- Recognition (registered email user name return, unregistered, incomplete)
- OTP Verification (correct, wrong attempts limit lockout, expiry, resend cooldown)
- Checkout (guest checkout, authenticated checkout, phone/address validations)
Ensure all tests run successfully with PYTHONPATH configured.
```

---

## 🚀 10. Deployment & GitHub
```text
Prepare Vercel configuration for the frontend and Render/Railway build commands for the backend.
Ensure environment variables (VITE_API_BASE_URL, DATABASE_URL, JWT_SECRET_KEY) are configured securely.
Provide steps to share the repository with the reviewer `boltapp-hiring`.
```

---

## 🐛 11. Bug Fixes
```text
Fix the 'Unknown column users.otp_attempts in field list' OperationalError.
Run a script to recreate database tables using SQLAlchemy Base.metadata.drop_all/create_all.
Ensure all tests pass and frontend build completes successfully.
```
