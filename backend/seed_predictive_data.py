import pymongo
from bson import ObjectId
from datetime import datetime, timedelta, timezone
import random

# Connection
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["pharmacy_db"]

def seed_predictive_data():
    print("🚀 Seeding Predictive Inventory Data...")
    
    # 1. Clear existing for these medicines (test isolation)
    med_names = ["Paracetamol 500mg", "Insulin Glargine", "Amoxicillin 250mg", "Vitamin D3", "Omeprazole 20mg"]
    db.medicines.delete_many({"name": {"$in": med_names}})
    
    # 2. Setup Medicines with specific stock levels
    meds = [
        {"name": "Paracetamol 500mg", "category": "Pain Relief", "price": 10.0, "stock": 50, "batch_number": "B-PARA-01"},
        {"name": "Insulin Glargine", "category": "Diabetes", "price": 450.0, "stock": 15, "batch_number": "B-INS-02"},
        {"name": "Amoxicillin 250mg", "category": "Antibiotics", "price": 25.0, "stock": 500, "batch_number": "B-AMOX-03"},
        {"name": "Vitamin D3", "category": "Vitamins", "price": 80.0, "stock": 100, "batch_number": "B-VIT-04"},
        {"name": "Omeprazole 20mg", "category": "Gastro", "price": 15.0, "stock": 3, "batch_number": "B-OME-05"}
    ]
    
    med_ids = {}
    for m in meds:
        m["created_at"] = datetime.now(timezone.utc)
        res = db.medicines.insert_one(m)
        med_ids[m["name"]] = res.inserted_id
        
    print(f"✅ Created {len(meds)} test medications.")

    # 3. Setup Helper Entities
    customer_id = str(ObjectId())
    staff_id = str(ObjectId())

    # 4. Generate Historical Bills (Sales History)
    # Target DBRs:
    # Para: 10 units/day (Should run out in 5 days -> Warning)
    # Insulin: 10 units/day (Should run out in 1.5 days -> Critical)
    # Ome: 2 units/day (Is already 3 stock -> Critical)
    # VitD: 0.5 units/day (Stable)
    # Amox: 2 units/day (Stable)
    
    velocities = {
        "Paracetamol 500mg": 10,
        "Insulin Glargine": 10,
        "Omeprazole 20mg": 2,
        "Vitamin D3": 0.5,
        "Amoxicillin 250mg": 2
    }
    
    now = datetime.now(timezone.utc)
    bills_to_insert = []
    
    # Spread sales over 30 days
    for day in range(30):
        sale_date = now - timedelta(days=day)
        
        for name, dbr in velocities.items():
            # If dbr < 1, we only sell on certain days
            if dbr < 1 and day % 2 != 0: continue
            
            qty = max(1, int(dbr))
            
            bill = {
                "bill_id": f"SEED-{day}-{name[:3]}",
                "bill_number": f"INV-2026-SEED-{day}",
                "customer_id": customer_id,
                "customer_name": "Test Predictive User",
                "staff_id": staff_id,
                "staff_name": "Seeding Bot",
                "medicines": [
                    {
                        "medicine_id": str(med_ids[name]),
                        "medicine_name": name,
                        "quantity": qty,
                        "price": 10.0,
                        "subtotal": 10.0 * qty
                    }
                ],
                "subtotal": 10.0 * qty,
                "tax": 0.5 * qty,
                "tax_rate": 0.05,
                "discount": 0.0,
                "total": 10.5 * qty,
                "payment_status": "Paid",
                "created_at": sale_date
            }
            bills_to_insert.append(bill)

    if bills_to_insert:
        db.bills.insert_many(bills_to_insert)
        print(f"✅ Injected {len(bills_to_insert)} historical sales records.")

    print("\n📈 Predictive Context:")
    print("- Omeprazole & Insulin should show as CRITICAL (high velocity, low stock)")
    print("- Paracetamol should show as WARNING (high velocity, medium stock)")
    print("- Amox & Vitamin D should show as HEALTHY (low velocity or high stock)")

if __name__ == "__main__":
    seed_predictive_data()
