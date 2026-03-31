import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "pharmacy_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    bill = await db["bills"].find_one({"bill_id": "8F9629F2"})
    if not bill:
         bill = await db["bills"].find_one({"bill_id": {"$regex": "^8F9629F2$", "$options": "i"}})
    
    if bill:
        print(f"FOUND: bill_id={bill.get('bill_id')}, mongo_id={bill['_id']}")
        # print specific fields that might cause issues
        print(f"Keys: {list(bill.keys())}")
    else:
        print("NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check())
