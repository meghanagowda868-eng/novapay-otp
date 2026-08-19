import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_guest_checkout():
    payload = {
        "email": "guest_buyer@example.com",
        "phone": "+19876543210",
        "shipping_address": "123 Market Street, Suite 400, San Francisco, CA"
    }
    response = client.post("/checkout", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "order_reference" in data
    assert data["order_reference"].startswith("ORD-")
    assert data["user_id"] is None
    assert data["email"] == "guest_buyer@example.com"

def test_authenticated_checkout():
    timestamp = int(time.time())
    email = f"auth_buyer_{timestamp}@example.com"

    # Register & Login
    reg_res = client.post("/auth/register", json={"first_name": "Auth", "last_name": "Buyer", "email": email})
    otp = reg_res.json()["otp"]
    
    login_res = client.post("/auth/login", json={"email": email, "otp": otp})
    token = login_res.json()["access_token"]
    user_id = login_res.json()["user"]["id"]

    # Authenticated Checkout
    payload = {
        "email": email,
        "phone": "+15550192834",
        "shipping_address": "456 Tech Boulevard, Innovation Hub, Austin, TX"
    }
    response = client.post("/checkout", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user_id
    assert data["email"] == email
    assert data["order_reference"].startswith("ORD-")
