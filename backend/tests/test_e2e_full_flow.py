import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_verification():
    print("==================================================")
    print("STARTING END-TO-END SYSTEM INTEGRATION VERIFICATION")
    print("==================================================")

    # 1. Health Check
    health_res = requests.get(f"{BASE_URL}/health")
    assert health_res.status_code == 200
    print("[OK] Health Check Passed:", health_res.json())

    # 2. Registration Flow (Flow A)
    timestamp = int(time.time())
    email = f"sarah_connor_{timestamp}@cyberdyne.com"
    reg_payload = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": email
    }
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    otp_code = reg_data["otp"]
    print(f"[OK] Flow A Passed: Registered {email} with OTP={otp_code} (Expires in {reg_data['expires_in_minutes']} minutes)")

    # 3. User Recognition Flow (Flow B)
    rec_res = requests.get(f"{BASE_URL}/auth/recognize", params={"email": email})
    assert rec_res.status_code == 200
    assert rec_res.json()["registered"] is True
    print(f"[OK] Flow B Recognition Passed: Recognized existing email {email}")

    unrec_res = requests.get(f"{BASE_URL}/auth/recognize", params={"email": f"unknown_{timestamp}@domain.com"})
    assert unrec_res.status_code == 200
    assert unrec_res.json()["registered"] is False
    print("[OK] Flow B Recognition Passed: Unregistered email correctly identified as false")

    # 4. OTP Login Verification (Flow B)
    # 4a. Invalid OTP attempt
    bad_login = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "otp": "000000"})
    assert bad_login.status_code == 400
    print("[OK] OTP Validation Passed: Rejected invalid OTP code '000000'")

    # 4b. Valid OTP attempt
    good_login = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "otp": otp_code})
    assert good_login.status_code == 200
    token_data = good_login.json()
    access_token = token_data["access_token"]
    user_id = token_data["user"]["id"]
    print(f"[OK] Flow B OTP Login Passed: Issued JWT token for user_id={user_id}")

    # 5. Authenticated Checkout Flow (Flow B)
    auth_checkout_payload = {
        "email": email,
        "phone": "+1 (555) 382-9102",
        "shipping_address": "742 Evergreen Terrace, Springfield, OR"
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    auth_order_res = requests.post(f"{BASE_URL}/checkout", json=auth_checkout_payload, headers=headers)
    assert auth_order_res.status_code == 201
    auth_order_data = auth_order_res.json()
    assert auth_order_data["user_id"] == user_id
    assert auth_order_data["order_reference"].startswith("ORD-")
    print(f"[OK] Authenticated Checkout Passed: Order Ref = {auth_order_data['order_reference']}, User ID = {auth_order_data['user_id']}")

    # 6. Guest Checkout Flow (Flow B)
    guest_email = f"guest_{timestamp}@example.com"
    guest_checkout_payload = {
        "email": guest_email,
        "phone": "+1 (555) 901-2345",
        "shipping_address": "100 Market St, San Francisco, CA"
    }
    guest_order_res = requests.post(f"{BASE_URL}/checkout", json=guest_checkout_payload)
    assert guest_order_res.status_code == 201
    guest_order_data = guest_order_res.json()
    assert guest_order_data["user_id"] is None
    assert guest_order_data["order_reference"].startswith("ORD-")
    print(f"[OK] Guest Checkout Passed: Order Ref = {guest_order_data['order_reference']}, User ID = {guest_order_data['user_id']}")

    # 7. Resend OTP Feature Verification (Extra Feature 2)
    resend_res = requests.post(f"{BASE_URL}/auth/resend-otp", json={"email": email})
    assert resend_res.status_code == 200
    new_otp = resend_res.json()["otp"]
    print(f"[OK] Resend OTP Passed: Generated new OTP={new_otp}")

    print("==================================================")
    print("ALL END-TO-END FLOWS FULLY VERIFIED AND SUCCESSFUL!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
