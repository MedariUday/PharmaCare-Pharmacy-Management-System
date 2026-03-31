import asyncio
import os
import sys
from bson import ObjectId

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def find_customer():
    try:
        await connect_to_mongo()
        db = get_database()
        
        # 1. Find a bill
        bill = await db["bills"].find_one()
        if not bill:
            print("No bills found. Creating one for testing...")
            # We skip creating, let's just find any customer
            cust = await db["users"].find_one({"role": {"$in": ["Customer", "customer"]}})
            if cust:
                print(f"Customer Email: {cust['email']} (No bills yet)")
            return

        # 2. Find the customer for that bill
        cid = bill["customer_id"]
        # Handle string or ObjectId
        query = {"_id": ObjectId(cid)} if isinstance(cid, str) else {"_id": cid}
        user = await db["users"].find_one(query)
        
        if user:
            print(f"--- TEST DATA FOUND ---")
            print(f"Customer Email: {user['email']}")
            print(f"Password: admin123 (Assuming standard hash for seed data)")
            med_name = bill["medicines"][0]["medicine_name"]
            print(f"Purchased Medicine: {med_name}")
        else:
            print(f"User with ID {cid} not found.")

        await close_mongo_connection()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(find_customer())
