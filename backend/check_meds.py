import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def check_medicine_data():
    try:
        await connect_to_mongo()
        db = get_database()
        meds = await db["medicines"].find().limit(20).to_list(20)
        print(f"--- Medicines Found: {len(meds)} ---")
        for m in meds:
            selling_price = m.get("selling_price")
            price = m.get("price")
            print(f"Name: {m['name']:<20} | Selling Price: {selling_price} | Price: {price}")
        await close_mongo_connection()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_medicine_data())
