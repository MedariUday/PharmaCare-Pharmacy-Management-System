import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_rec():
    uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "pharmacy_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Simulate the logic
    try:
        # Fallback logic check
        top_items = await db["medicines"].find().sort("stock", -1).limit(5).to_list(5)
        print(f"Fallback works: {len(top_items)} items")
        
        # Aggregate check
        pipeline = [{"$sample": {"size": 2}}]
        cat_items = await db["medicines"].aggregate(pipeline).to_list(10)
        print(f"Aggregate works: {len(cat_items)} items")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_rec())
