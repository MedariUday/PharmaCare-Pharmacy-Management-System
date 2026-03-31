import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_chatbot_search(query):
    # Login to get token (using form-data as required by OAuth2PasswordRequestForm)
    login_data = {"username": "admin@admin.com", "password": "admin123"}
    login_res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.text}")
        return

    res_json = login_res.json()
    token = res_json.get("access_token")
    user_name = res_json.get("name")
    user_role = res_json.get("role")
    
    headers = {"Authorization": f"Bearer {token}"}
    chat_data = {"message": query}
    
    print(f"\n--- Testing Query: '{query}' (User: {user_name}, Role: {user_role}) ---")
    chat_res = requests.post(f"{BASE_URL}/chatbot/query/", json=chat_data, headers=headers)
    
    if chat_res.status_code == 200:
        data = chat_res.json()
        print(f"Reply: {data.get('reply')}")
        recs = data.get('recommendations', [])
        if not recs:
            print("No recommendations found.")
        for rec in recs:
            print(f"Match: {rec.get('name')} | Price: {rec.get('price')} | Type: {rec.get('match_type')}")
    else:
        print(f"Chat Query Failed {chat_res.status_code}: {chat_res.text}")

if __name__ == "__main__":
    test_chatbot_search("paci")
    test_chatbot_search("pacimoll")
    test_chatbot_search("dolo 65")
