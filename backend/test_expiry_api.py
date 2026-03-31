import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_expiry(email, password, query):
    # 1. Login
    login_data = {"username": email, "password": password}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Login failed for {email}: {res.text}")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Chat Query
    chat_data = {"message": query}
    res = requests.post(f"{BASE_URL}/chatbot/query/", json=chat_data, headers=headers)
    print(f"\n--- Testing Query: '{query}' as {email} ---")
    if res.status_code == 200:
        data = res.json()
        print(f"Reply: {data.get('reply')}")
        recs = data.get('recommendations', [])
        for r in recs:
            print(f"Card: {r['name']} | Expiry: {r.get('expiry_date')} | Match: {r.get('match_type')}")
    else:
        print(f"Error {res.status_code}: {res.text}")

if __name__ == "__main__":
    # Test Admin
    test_expiry("admin@admin.com", "admin123", "expiry of pacimoll")
    
    # Test Customer - Rahul (He has a bill for Paracetamol in my DB state)
    test_expiry("rahul@example.com", "admin123", "when does paracetamol expire")
    test_expiry("rahul@example.com", "admin123", "expiry of crocin")
