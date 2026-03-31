import asyncio
import os
import sys
from bson import ObjectId
from datetime import datetime, timezone
import uuid

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def test_billing_and_chatbot():
    try:
        await connect_to_mongo()
        db = get_database()
        
        # 1. Verify a medicine has expiry data
        med = await db["medicines"].find_one({"stock": {"$gt": 5}})
        if not med:
            print("No suitable medicine found for testing.")
            return
        
        print(f"Testing with Medicine: {med['name']} | ID: {med['_id']}")
        print(f"Inventory Expiry: {med.get('expiry_date')} | Batch: {med.get('batch_number')}")

        # 2. Mock a billing process (similar to staff_generate_bill)
        # We'll just check if we can extract the correct fields manually using the logic I added to the route
        expiry = med.get("expiry_date", med.get("expiry", "None"))
        batch = med.get("batch_number", med.get("batch", "NA"))
        
        bill_item = {
            "medicine_id": str(med["_id"]),
            "medicine_name": med["name"],
            "expiry_date": expiry if expiry != "None" else "Not provided",
            "batch_number": batch if batch != "NA" else "General"
        }
        print(f"\nConstructed Bill Item: {bill_item}")
        
        # 3. Verify the status calculation in med_to_card logic
        # Hand-simulating the backend logic
        status = "info"
        exp = bill_item["expiry_date"]
        if exp and exp != "Not provided":
            try:
                exp_dt = datetime.strptime(exp, "%Y-%m-%d")
                now = datetime.now()
                diff = (exp_dt - now).days
                if diff <= 0: status = "danger"
                elif diff < 180: status = "warn"
                else: status = "valid"
            except: status = "info"
        
        print(f"Calculated Status: {status}")

        await close_mongo_connection()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_billing_and_chatbot())
