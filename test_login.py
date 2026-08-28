import requests
import sys

base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

print(f"Testing Auth Endpoints on {base_url}...")

# Test 1: Admin Login
print("\n1. Testing Admin Login...")
try:
    res = requests.post(f"{base_url}/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpassword"
    })
    print("Status:", res.status_code)
    print("Response:", res.json())
except Exception as e:
    print("Error:", e)

# Test 2: Invalid Login
print("\n2. Testing Invalid Password...")
try:
    res = requests.post(f"{base_url}/auth/login", json={
        "email": "admin@example.com",
        "password": "wrongpassword"
    })
    print("Status (Expected 401):", res.status_code)
    print("Response:", res.json())
except Exception as e:
    print("Error:", e)

