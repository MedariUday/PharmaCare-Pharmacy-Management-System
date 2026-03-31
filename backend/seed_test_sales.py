import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import sys
import uuid

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from app.config import settings

async def seed_test_sales():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("🌱 Seeding Realistic Sales Data for Clinical Analytics...")
    
    # 1. Ensure we have medicines with specific categories and clear margins
    # We use explicit 24-char hex strings for ObjectIDs to be professional
    medicines = [
        {"_id": ObjectId("65f1a1b2c3d4e5f678901234"), "name": "Amoxicillin 500mg", "category": "Antibiotic", "purchase_price": 12.50, "selling_price": 45.00, "stock": 100, "batch_number": "AB-101", "expiry_date": datetime(2027, 5, 1)},
        {"_id": ObjectId("65f1a1b2c3d4e5f678901235"), "name": "Paracetamol 650", "category": "Analgesic", "purchase_price": 2.10, "selling_price": 15.00, "stock": 500, "batch_number": "PA-202", "expiry_date": datetime(2026, 12, 1)},
        {"_id": ObjectId("65f1a1b2c3d4e5f678901236"), "name": "Cough Syrup Plus", "category": "Syrup", "purchase_price": 35.00, "selling_price": 120.00, "stock": 50, "batch_number": "SY-303", "expiry_date": datetime(2025, 8, 1)},
        {"_id": ObjectId("65f1a1b2c3d4e5f678901237"), "name": "Lantus Insulin", "category": "Injection", "purchase_price": 450.00, "selling_price": 850.00, "stock": 20, "batch_number": "IN-404", "expiry_date": datetime(2025, 6, 1)},
    ]
    
    med_ids = []
    for m in medicines:
        m["minimum_stock"] = 10
        m["created_at"] = datetime.now(timezone.utc)
        await db["medicines"].replace_one({"_id": m["_id"]}, m, upsert=True)
        med_ids.append(m)
        print(f"✅ Synced Medicine: {m['name']} (Cat: {m['category']} | ID: {m['_id']})")

    # 2. Clear existing bills/orders to avoid noise (Optional, but good for testing)
    # await db["bills"].delete_many({})
    # await db["orders"].delete_many({})

    # 3. Generate Sales over the last 7 days
    now = datetime.now(timezone.utc)
    bill_count = 0
    
    for i in range(15):
        # Random day in the last 7 days
        import random
        days_ago = random.randint(0, 7)
        created_at = now - timedelta(days=days_ago)
        
        # Select 1-2 random medicines
        sample_meds = random.sample(med_ids, random.randint(1, 2))
        enriched_items = []
        subtotal = 0
        
        for m in sample_meds:
            qty = random.randint(1, 5)
            price = m["selling_price"]
            item_total = round(price * qty, 2)
            subtotal += item_total
            
            enriched_items.append({
                "medicine_id": str(m["_id"]),
                "medicine_name": m["name"],
                "price": price,
                "quantity": qty,
                "subtotal": item_total,
                "category": m["category"]
            })
            
        tax_rate = 0.05
        tax = round(subtotal * tax_rate, 2)
        total = round(subtotal + tax, 2)
        bill_id = str(uuid.uuid4())[:8].upper()
        
        bill_data = {
            "bill_id": bill_id,
            "bill_number": f"TEST-{bill_id}",
            "customer_id": "test_customer",
            "customer_name": "Test Analytics User",
            "staff_id": "test_staff",
            "staff_name": "Test Staff",
            "medicines": enriched_items,
            "subtotal": subtotal,
            "tax": tax,
            "tax_rate": tax_rate,
            "total": total,
            "payment_status": "Paid",
            "created_at": created_at
        }
        
        await db["bills"].insert_one(bill_data)
        bill_count += 1
        
    print(f"🎉 Successfully seeded {bill_count} test sales across multiple categories.")

if __name__ == "__main__":
    asyncio.run(seed_test_sales())
