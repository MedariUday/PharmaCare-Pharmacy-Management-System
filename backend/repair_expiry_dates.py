import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def repair_expiry_dates():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("🛠️ Starting Medicine Expiry Date Repair...")
    
    # 1. Identify records with Jan 1970 dates (epoch 0)
    # We look for dates on Jan 1st 1970
    epoch_start = datetime(1970, 1, 1)
    epoch_end = datetime(1970, 1, 2)
    
    query = {
        "$or": [
            {"expiry_date": {"$gte": epoch_start, "$lt": epoch_end}},
            {"expiry_date": "1970-01-01"},
            {"expiry_date": ""},
            {"expiry_date": "null"}
        ]
    }
    
    affected_count = await db['medicines'].count_documents(query)
    print(f"🔍 Found {affected_count} records with invalid/epoch expiry dates.")
    
    if affected_count > 0:
        result = await db['medicines'].update_many(
            query,
            {"$set": {"expiry_date": None}}
        )
        print(f"✅ Successfully converted {result.modified_count} records to null.")
    else:
        print("✨ No corrupt dates found. Database is clean.")

    # 2. Migration: Ensure all string-based valid dates are converted to datetime objects
    # (Optional, but good for consistency)
    cursor = db['medicines'].find({"expiry_date": {"$type": "string"}})
    migrated = 0
    async for m in cursor:
        val = m.get("expiry_date")
        if not val or val in ["", "null", "1970-01-01"]:
            continue
            
        try:
            # Try to parse and convert to datetime
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            await db['medicines'].update_one({"_id": m["_id"]}, {"$set": {"expiry_date": dt}})
            migrated += 1
        except Exception:
            # If not a valid ISO date, set to None to be safe
            await db['medicines'].update_one({"_id": m["_id"]}, {"$set": {"expiry_date": None}})
            migrated += 1
            
    if migrated > 0:
        print(f"📦 Migrated {migrated} string dates to proper datetime objects.")

if __name__ == "__main__":
    asyncio.run(repair_expiry_dates())
