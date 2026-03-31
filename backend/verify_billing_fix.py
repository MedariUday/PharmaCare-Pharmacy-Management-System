import urllib.request
import urllib.parse
import json
import codecs

BASE_URL = "http://localhost:8000/api"

def call_api(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}/{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = json.dumps(data).encode("utf-8") if data else None
    request = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(request) as response:
            reader = codecs.getreader("utf-8")
            return json.load(reader(response))
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Error {e.code}: {body}")
        return {"error": True, "code": e.code, "detail": body}
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_billing():
    # 1. Login
    login_url = f"{BASE_URL}/auth/login"
    login_data = urllib.parse.urlencode({"username": "staff@example.com", "password": "password123"}).encode("utf-8")
    login_headers = {"Content-Type": "application/x-www-form-urlencoded"}
    login_req = urllib.request.Request(login_url, data=login_data, headers=login_headers, method="POST")
    
    try:
        with urllib.request.urlopen(login_req) as resp:
            login_res = json.load(codecs.getreader("utf-8")(resp))
            token = login_res["access_token"]
            print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Get first customer
    customers = call_api("customers/", token=token)
    if not customers or "error" in customers: 
        print(f"Could not fetch customers: {customers}")
        return
    cust_id = customers[0]["id"]
    print(f"Testing with Customer: {customers[0]['name']} ({cust_id})")

    # 3. Get first medicine from paginated response field 'data'
    med_res = call_api("medicines/", token=token)
    if not med_res or "error" in med_res or "data" not in med_res:
        print(f"Could not fetch medicines or wrong structure: {med_res}")
        return
    
    if not med_res["data"]:
        print("No medicines found in the system.")
        return
        
    med = med_res["data"][0]
    print(f"Testing with Medicine: {med['name']} ({med['id']})")

    # 4. Add to cart
    cart_data = {
        "customer_id": cust_id,
        "medicines": [{"medicine_id": med["id"], "quantity": 1, "price": med.get("selling_price", 10.0)}]
    }
    cart_res = call_api("cart/create", method="POST", data=cart_data, token=token)
    if not cart_res or "error" in cart_res:
        print(f"Cart creation failed: {cart_res}")
        return
    print("Cart created successfully.")

    # 5. Generate Bill
    bill_req = {"customer_id": cust_id, "tax_rate": 0.05, "discount": 0.0, "payment_status": "Paid"}
    bill_res = call_api("staff/generate-bill", method="POST", data=bill_req, token=token)
    
    if bill_res and "error" not in bill_res:
        print("--- BILL GENERATED SUCCESSFULLY ---")
        print(json.dumps(bill_res, indent=2))
        return True
    else:
        print("--- BILL GENERATION FAILED ---")
        print(json.dumps(bill_res, indent=2))
        return False

if __name__ == "__main__":
    test_billing()
