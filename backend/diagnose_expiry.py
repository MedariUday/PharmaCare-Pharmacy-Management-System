import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def diagnose_expiry_dates():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("📋 Diagnostic: Medicine Expiry Dates in MongoDB\n")
    print(f"{'Medicine Name':<30} | {'Expiry Date':<30} | {'Type':<15}")
    print("-" * 80)
    
    cursor = db['medicines'].find({}, {'name': 1, 'expiry_date': 1})
    async for m in cursor:
        name = m.get("name", "Unknown")
        exp = m.get("expiry_date")
        exp_type = type(exp).__name__
        print(f"{name:<30} | {str(exp):<30} | {exp_type:<15}")

if __name__ == "__main__":
    asyncio.run(diagnose_expiry_dates())
