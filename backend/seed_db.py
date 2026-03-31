import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import random

# We'll import the password hasher from the app
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.utils.password_hash import get_password_hash

# Data Sets
USERS = [
    {"name": "Ananya Sharma", "email": "ananya@admin.com", "password": "password123", "role": "Admin"},
    {"name": "Rajesh Kumar", "email": "rajesh@admin.com", "password": "password123", "role": "Admin"},
    {"name": "Sneha Patel", "email": "sneha@pharma.com", "password": "password123", "role": "Pharmacist"},
    {"name": "Karan Singh", "email": "karan@pharma.com", "password": "password123", "role": "Pharmacist"},
    {"name": "Pooja Gupta", "email": "pooja@staff.com", "password": "password123", "role": "Staff"},
]

SUPPLIERS = [
    {"name": "Sun Pharma Distributors", "contact": "9876543210", "address": "Andheri East, Mumbai"},
    {"name": "Cipla Logistics Hub", "contact": "9876543211", "address": "Vikhroli, Mumbai"},
    {"name": "Mankind Vendors", "contact": "9876543212", "address": "Okhla Phase 1, New Delhi"},
    {"name": "Dr. Reddy's Wholesale", "contact": "9876543213", "address": "Banjara Hills, Hyderabad"},
    {"name": "Torrent Pharma Hub", "contact": "9876543214", "address": "Ashram Road, Ahmedabad"},
]

CUSTOMERS = [
    {"name": "Rahul Sharma", "phone": "9998887771"},
    {"name": "Priya Patel", "phone": "9998887772"},
    {"name": "Amit Singh", "phone": "9998887773"},
    {"name": "Neha Gupta", "phone": "9998887774"},
    {"name": "Vikram Reddy", "phone": "9998887775"},
]

MEDICINES = [
    {"name": "Dolo 650", "category": "Analgesic", "manufacturer": "Micro Labs", "batch_number": "B1001", "purchase_price": 20.0, "selling_price": 30.0, "stock": 150},
    {"name": "Calpol 500", "category": "Analgesic", "manufacturer": "GSK", "batch_number": "B1002", "purchase_price": 12.0, "selling_price": 18.0, "stock": 200},
    {"name": "Augmentin 625 Duo", "category": "Antibiotic", "manufacturer": "GSK", "batch_number": "B1003", "purchase_price": 150.0, "selling_price": 200.0, "stock": 50},
    {"name": "Allegra 120", "category": "Antihistamine", "manufacturer": "Sanofi", "batch_number": "B1004", "purchase_price": 120.0, "selling_price": 160.0, "stock": 80},
    {"name": "Telma 40", "category": "Antihypertensive", "manufacturer": "Glenmark", "batch_number": "B1005", "purchase_price": 90.0, "selling_price": 130.0, "stock": 100},
    {"name": "Pan 40", "category": "Antacid", "manufacturer": "Alkem", "batch_number": "B1006", "purchase_price": 110.0, "selling_price": 145.0, "stock": 120},
    {"name": "Shelcal 500", "category": "Supplement", "manufacturer": "Torrent", "batch_number": "B1007", "purchase_price": 85.0, "selling_price": 110.0, "stock": 90},
    {"name": "Ecosprin 75", "category": "Blood Thinner", "manufacturer": "USV", "batch_number": "B1008", "purchase_price": 4.0, "selling_price": 5.5, "stock": 300},
    {"name": "Gluconorm G 1", "category": "Antidiabetic", "manufacturer": "Lupin", "batch_number": "B1009", "purchase_price": 140.0, "selling_price": 180.0, "stock": 60},
    {"name": "Azithral 500", "category": "Antibiotic", "manufacturer": "Alembic", "batch_number": "B1010", "purchase_price": 100.0, "selling_price": 125.0, "stock": 40},
]

async def seed():
    print("🌱 Starting database seeding...")
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['pharmacy_db']
    
    # 1. Insert Users
    user_ids = []
    for u in USERS:
        u['password'] = get_password_hash(u['password'])
        u['created_at'] = datetime.now(timezone.utc)
        res = await db.users.insert_one(u)
        user_ids.append(res.inserted_id)
    print(f"✅ Added {len(user_ids)} Users")

    # 2. Insert Suppliers
    supplier_ids = []
    for s in SUPPLIERS:
        s['created_at'] = datetime.now(timezone.utc)
        res = await db.suppliers.insert_one(s)
        supplier_ids.append(res.inserted_id)
    print(f"✅ Added {len(supplier_ids)} Suppliers")

    # 3. Insert Customers
    customer_ids = []
    for c in CUSTOMERS:
        c['created_at'] = datetime.now(timezone.utc)
        res = await db.customers.insert_one(c)
        customer_ids.append(res.inserted_id)
    print(f"✅ Added {len(customer_ids)} Customers")

    # 4. Insert Medicines
    medicine_ids = []
    for i, m in enumerate(MEDICINES):
        m['created_at'] = datetime.now(timezone.utc)
        # Random expiry date between 6 months and 3 years from now
        days_to_expiry = random.randint(180, 1095)
        m['expiry_date'] = datetime.now(timezone.utc) + timedelta(days=days_to_expiry)
        # Assign random supplier
        m['supplier_id'] = str(random.choice(supplier_ids))
        res = await db.medicines.insert_one(m)
        medicine_ids.append(res.inserted_id)
        
        # 5. Insert Initial Inventory Log for each medicine
        await db.inventory_logs.insert_one({
            "medicine_id": str(res.inserted_id),
            "quantity": m['stock'],
            "type": "IN",
            "reason": "Initial Stock",
            "user_id": str(random.choice(user_ids)),
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        })
    print(f"✅ Added {len(medicine_ids)} Medicines and their Inventory Logs")

    # 6. Insert Sales
    sales_created = 0
    for _ in range(10):
        cust_id = random.choice(customer_ids)
        num_items = random.randint(1, 3)
        sale_medicines = []
        total_amount = 0.0
        
        # Pick random medicines
        picked_meds = random.sample(medicine_ids, num_items)
        for med_id in picked_meds:
            med_doc = await db.medicines.find_one({"_id": med_id})
            qty = random.randint(1, 5)
            price = med_doc['selling_price']
            subtotal = qty * price
            
            sale_medicines.append({
                "medicine_id": str(med_id),
                "quantity": qty,
                "price": price
            })
            total_amount += subtotal
            
            # Decrease stock
            await db.medicines.update_one({"_id": med_id}, {"$inc": {"stock": -qty}})
            
            # Add out inventory log
            await db.inventory_logs.insert_one({
                "medicine_id": str(med_id),
                "quantity": qty,
                "type": "OUT",
                "reason": "Sale",
                "user_id": str(random.choice(user_ids)),
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
            })
            
        await db.sales.insert_one({
            "customer_id": str(cust_id),
            "medicines": sale_medicines,
            "total_amount": total_amount,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
        })
        sales_created += 1

    print(f"✅ Added {sales_created} Sales Records and corresponding OUT Inventory Logs")
    print("🎉 Database seeding complete! You can now log in and test the application.")

if __name__ == "__main__":
    asyncio.run(seed())
