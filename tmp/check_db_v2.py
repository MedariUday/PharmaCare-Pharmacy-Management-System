import motor.motor_asyncio
import asyncio
import json

async def run():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27014')
        db = client['pharmacy_db']
        collection = db['medicines']
        
        # Get unique categories
        categories = await collection.distinct('category')
        print(f"CATEGORIES_IN_DB: {categories}")
        
        # Sample 5 medicines
        cursor = collection.find().limit(5)
        samples = []
        async for doc in cursor:
            samples.append({
                "name": doc.get("name"),
                "category": doc.get("category"),
                "selling_price": doc.get("selling_price")
            })
        print(f"SAMPLES: {json.dumps(samples, indent=2)}")
        
        await client.close()
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(run())
