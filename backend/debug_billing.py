import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_generate_bill():
    # 1. Login as staff
    login_data = {"username": "staff@example.com", "password": "admin123"}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get a customer and medicine to play with
    # Let's assume some common IDs or fetch them
    db_check = requests.get(f"{BASE_URL}/customers/", headers=headers)
    if not db_check.ok or not db_check.json():
        print("No customers found to test.")
        return
    customer = db_check.json()[0]
    cust_id = customer["id"]

    med_check = requests.get(f"{BASE_URL}/medicines/", headers=headers)
    if not med_check.ok or not med_check.json():
        print("No medicines found to test.")
        return
    medicine = med_check.json()[0]
    med_id = medicine["id"]

    # 3. Create a cart
    cart_data = {
        "customer_id": cust_id,
        "medicines": [
            {"medicine_id": med_id, "quantity": 1, "price": medicine.get("selling_price", 10.0)}
        ]
    }
    res = requests.post(f"{BASE_URL}/cart/create", json=cart_data, headers=headers)
    if not res.ok:
        print(f"Cart creation failed: {res.text}")
        return

    # 4. Generate bill
    bill_req = {
        "customer_id": cust_id,
        "tax_rate": 0.05,
        "discount": 0.0,
        "payment_status": "Paid"
    }
    res = requests.post(f"{BASE_URL}/staff/generate-bill", json=bill_req, headers=headers)
    print(f"Generate Bill Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_generate_bill()
