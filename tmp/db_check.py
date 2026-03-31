import motor.motor_asyncio
import asyncio

async def run():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27014')
    db = client['pharmacy_db']
    medicines = db['medicines']
    
    # Get all unique categories
    categories = await medicines.distinct('category')
    print("ALL CATEGORIES IN DB:", categories)
    
    # Check count for each
    for cat in categories:
        count = await medicines.count_documents({'category': cat})
        print(f"Category: {cat}, Count: {count}")
    
    await client.close()

if __name__ == '__main__':
    asyncio.run(run())
