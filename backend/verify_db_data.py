import asyncio
import os
import sys
import json
from bson import json_util

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def check_data():
    try:
        await connect_to_mongo()
        db = get_database()
        
        # Check one bill - print full JSON to see field names
        bill = await db["bills"].find_one()
        if bill:
            print(f"--- SAMPLE BILL JSON ---")
            print(json.dumps(bill, default=json_util.default, indent=2))
        else:
            print("No bills found.")

        # Check one medicine
        med = await db["medicines"].find_one({"stock": {"$gt": 0}})
        if med:
            print(f"\n--- SAMPLE MEDICINE INVENTORY JSON ---")
            print(json.dumps(med, default=json_util.default, indent=2))
            
        await close_mongo_connection()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
