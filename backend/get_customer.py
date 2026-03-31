import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def get_user():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "pharmacy_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    user = await db["users"].find_one({"role": "Customer"})
    if user:
        print(f"EMAIL: {user['email']}")
        print(f"NAME: {user['name']}")
    else:
        print("NO CUSTOMER FOUND")

if __name__ == "__main__":
    asyncio.run(get_user())
