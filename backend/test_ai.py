import asyncio
import httpx

async def test_ai():
    # We need a token. I'll just check if the endpoints are 401 as expected (meaning they are registered)
    # or I can try to find a user to log in.
    
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Check Recommendations
        res_rec = await client.get(f"{base_url}/api/customer/recommendations/")
        print(f"Recommendations Status (Expected 401 without token): {res_rec.status_code}")
        
        # Check Chatbot
        res_chat = await client.post(f"{base_url}/api/chatbot/query/", json={"message": "Do you have Paracetamol?"})
        print(f"Chatbot Status (Expected 401 without token): {res_chat.status_code}")

if __name__ == "__main__":
    asyncio.run(test_ai())
