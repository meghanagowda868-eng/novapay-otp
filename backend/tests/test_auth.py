import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_user_registration_and_recognition():
    timestamp = int(time.time())
    email = f"testuser_{timestamp}@example.com"

    # 1. Register User
    reg_payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": email
    }
    reg_res = client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "user" in data
    assert data["user"]["email"] == email
    assert len(data["otp"]) == 6
    assert data["otp"].isdigit()
    otp_code = data["otp"]

    # 2. Duplicate Registration Error
    dup_res = client.post("/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Email Recognition - Registered (returns user first & last name)
    rec_res = client.get(f"/auth/recognize?email={email}")
    assert rec_res.status_code == 200
    assert rec_res.json()["registered"] is True
    assert rec_res.json()["first_name"] == "Test"
    assert rec_res.json()["last_name"] == "User"

    # Alias recognition endpoint check
    alias_rec = client.get(f"/api/users/recognize?email={email}")
    assert alias_rec.status_code == 200
    assert alias_rec.json()["registered"] is True

    # 4. Email Recognition - Unregistered
    unreg_res = client.get("/auth/recognize?email=unregistered_email_xyz@example.com")
    assert unreg_res.status_code == 200
    assert unreg_res.json()["registered"] is False

    # 5. Invalid OTP Login (Checks attempt count)
    invalid_login = client.post("/auth/login", json={"email": email, "otp": "000000"})
    assert invalid_login.status_code == 400
    assert "Invalid login code" in invalid_login.json()["detail"]

    # 6. Valid OTP Login
    valid_login = client.post("/auth/login", json={"email": email, "otp": otp_code})
    assert valid_login.status_code == 200
    token_data = valid_login.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 7. Get Current User Profile
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

def test_max_otp_attempts_lockout():
    timestamp = int(time.time())
    email = f"attempts_user_{timestamp}@example.com"

    # Register
    reg_res = client.post("/auth/register", json={"first_name": "Attempts", "last_name": "Tester", "email": email})
    assert reg_res.status_code == 201

    # 5 Invalid OTP Attempts
    for i in range(5):
        fail_res = client.post("/auth/login", json={"email": email, "otp": "999999"})
        assert fail_res.status_code == 400

    # 6th attempt should return lockout message
    lockout_res = client.post("/auth/login", json={"email": email, "otp": "999999"})
    assert lockout_res.status_code == 400
    assert "Too many failed attempts" in lockout_res.json()["detail"]

    # Resend OTP unlocks account
    resend_res = client.post("/auth/resend-otp", json={"email": email})
    assert resend_res.status_code == 200
    new_otp = resend_res.json()["otp"]

    # New OTP login succeeds
    login_res = client.post("/auth/login", json={"email": email, "otp": new_otp})
    assert login_res.status_code == 200

def test_resend_otp():
    timestamp = int(time.time())
    email = f"resend_user_{timestamp}@example.com"

    # Register
    reg_res = client.post("/auth/register", json={"first_name": "Resend", "last_name": "Tester", "email": email})
    assert reg_res.status_code == 201
    old_otp = reg_res.json()["otp"]

    # Resend OTP
    resend_res = client.post("/auth/resend-otp", json={"email": email})
    assert resend_res.status_code == 200
    new_otp = resend_res.json()["otp"]
    assert len(new_otp) == 6

    # New OTP should work
    new_login = client.post("/auth/login", json={"email": email, "otp": new_otp})
    assert new_login.status_code == 200

def test_user_order_history():
    timestamp = int(time.time())
    email = f"history_user_{timestamp}@example.com"

    reg_res = client.post("/auth/register", json={"first_name": "History", "last_name": "User", "email": email})
    otp = reg_res.json()["otp"]
    login_res = client.post("/auth/login", json={"email": email, "otp": otp})
    token = login_res.json()["access_token"]

    # Submit checkout order
    checkout_res = client.post(
        "/checkout",
        json={"email": email, "phone": "+15551234567", "shipping_address": "789 History Ave, NY"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert checkout_res.status_code == 201

    # Fetch orders
    orders_res = client.get("/auth/orders", headers={"Authorization": f"Bearer {token}"})
    assert orders_res.status_code == 200
    orders_data = orders_res.json()
    assert len(orders_data) >= 1
    assert orders_data[0]["email"] == email

