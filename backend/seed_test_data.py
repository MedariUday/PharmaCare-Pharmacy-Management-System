import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
from passlib.context import CryptContext

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "pharmacy_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # 1. Create Customer
    hashed_password = pwd_context.hash("customer123")
    customer_user = {
        "email": "test@customer.com",
        "password": hashed_password,
        "name": "Test Customer",
        "role": "Customer",
        "phone": "9876543210"
    }
    res = await db["users"].insert_one(customer_user)
    cust_id = str(res.inserted_id)
    
    # 2. Add some medicines if none exist with category Fever
    med = await db["medicines"].find_one({"category": "Fever"})
    if not med:
        await db["medicines"].insert_one({
            "name": "Paracetamol",
            "category": "Fever",
            "price": 25.0,
            "stock": 100,
            "expiry_date": "2026-10-10"
        })
    
    # Ensure Vitamin C (target for recommendation) exists
    vitc = await db["medicines"].find_one({"name": "Vitamin C"})
    if not vitc:
        await db["medicines"].insert_one({
            "name": "Vitamin C",
            "category": "Supplements",
            "price": 50.0,
            "stock": 50,
            "expiry_date": "2026-12-12"
        })

    # 3. Create a past bill
    bill = {
        "bill_id": "TESTBILL01",
        "customer_id": cust_id,
        "customer_name": "Test Customer",
        "medicines": [{
            "medicine_id": "dummy",
            "medicine_name": "Paracetamol",
            "quantity": 2,
            "price": 25.0,
            "category": "Fever",
            "subtotal": 50.0
        }],
        "total": 50.0,
        "tax": 2.5,
        "subtotal": 47.5,
        "created_at": datetime.now(timezone.utc)
    }
    await db["bills"].insert_one(bill)
    print("SEEDING COMPLETE: test@customer.com / customer123")

if __name__ == "__main__":
    asyncio.run(seed())
