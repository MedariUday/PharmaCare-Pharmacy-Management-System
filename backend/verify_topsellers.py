import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def verify_top_sellers():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Direct aggregation with logic
    pipeline = [
        {"$unwind": "$medicines"},
        {"$group": {
            "_id": "$medicines.medicine_id",
            "name": {"$first": {"$ifNull": ["$medicines.medicine_name", "$medicines.name"]}},
            "total_sold": {"$sum": "$medicines.quantity"}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": 5}
    ]
    results = await db["bills"].aggregate(pipeline).to_list(5)
    
    print(f"📊 DIAGNOSTIC: Top Selling Medicines Found: {len(results)}")
    for r in results:
        print(f" - {r.get('name', 'UNKNOWN')}: {r.get('total_sold', 0)} units")

if __name__ == "__main__":
    asyncio.run(verify_top_sellers())
