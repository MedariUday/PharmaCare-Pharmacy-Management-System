import asyncio
import random
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection
from app.utils.password_hash import get_password_hash

async def seed_data():
    await connect_to_mongo()
    db = get_database()
    
    print("Clearing existing data for seeding collections...")
    await db["customers"].delete_many({})
    await db["medicines"].delete_many({})
    await db["orders"].delete_many({})
    await db["bills"].delete_many({})
    await db["carts"].delete_many({})
    await db["inventory_logs"].delete_many({})
    await db["users"].delete_many({})
    await db["suppliers"].delete_many({})
    await db["inventory_logs"].delete_many({}) # Just double checking

    # 0. Seed System Users (Admin, Pharmacist, Staff)
    hashed_pass = get_password_hash("password123")
    system_users = [
        {"name": "System Admin", "email": "admin@example.com", "role": "Admin", "password": hashed_pass},
        {"name": "Head Pharmacist", "email": "pharmacist@example.com", "role": "Pharmacist", "password": hashed_pass},
        {"name": "Billing Staff", "email": "staff@example.com", "role": "Staff", "password": hashed_pass}
    ]
    for u in system_users:
        u["created_at"] = datetime.now(timezone.utc)
        await db["users"].insert_one(u)
    print(f"Inserted {len(system_users)} system users.")

    # 1. Seed Medicines (20)
    medicine_names = [
        ("Paracetamol 500mg", "Analgesic", "GSK"),
        ("Crocin 650", "Antipyretic", "GSK"),
        ("Dolo 650", "Antipyretic", "Micro Labs"),
        ("Azithromycin 500mg", "Antibiotic", "Cipla"),
        ("Amoxicillin 250mg", "Antibiotic", "Abbott"),
        ("Vitamin C Tablets", "Supplement", "HealthKart"),
        ("Ibuprofen 400mg", "Analgesic", "Sun Pharma"),
        ("Cetirizine 10mg", "Antihistamine", "Dr. Reddy's"),
        ("Metformin 500mg", "Antidiabetic", "Lupin"),
        ("Amlodipine 5mg", "Antihypertensive", "Zydus"),
        ("Pantoprazole 40mg", "Antacid", "Alkem"),
        ("Atorvastatin 10mg", "Cholesterol", "Biocon"),
        ("Montelukast 10mg", "Asthma", "Glenmark"),
        ("Omeprazole 20mg", "Antacid", "Torrent"),
        ("Losartan 50mg", "Antihypertensive", "Ipca"),
        ("Diclofenac Gel", "Pain Relief", "Voveran"),
        ("Bcomplex Capsules", "Supplement", "Becosules"),
        ("Digene Syrup", "Antacid", "Abbott"),
        ("Strepsils", "Sore Throat", "Reckitt"),
        ("Oseltamivir 75mg", "Antiviral", "Roche")
    ]
    
    medicines = []
    for i, (name, cat, man) in enumerate(medicine_names):
        med = {
            "name": name,
            "category": cat,
            "manufacturer": man,
            "batch_number": f"BN-{random.randint(1000, 9999)}",
            "expiry_date": (datetime.now() + timedelta(days=random.randint(365, 730))).strftime("%Y-%m-%d"),
            "purchase_price": round(random.uniform(10, 100), 2),
            "selling_price": round(random.uniform(120, 500), 2),
            "stock": random.randint(50, 200),
            "barcode": f"890123{random.randint(100000, 999999)}"
        }
        res = await db["medicines"].insert_one(med)
        med["_id"] = res.inserted_id
        medicines.append(med)
    print(f"Inserted {len(medicines)} medicines.")

    # 2. Seed Customers (10)
    customer_data = [
        ("John Doe", "john@example.com"),
        ("Rahul Sharma", "rahul@example.com"),
        ("Priya Reddy", "priya@example.com"),
        ("Anjali Gupta", "anjali@example.com"),
        ("Vikram Singh", "vikram@example.com"),
        ("Suresh Kumar", "suresh@example.com"),
        ("Meera Iyer", "meera@example.com"),
        ("Amit Patel", "amit@example.com"),
        ("Sneha Kapoor", "sneha@example.com"),
        ("Rohan Verma", "rohan@example.com")
    ]
    
    hashed_pass = get_password_hash("password123")
    customers = []
    for name, email in customer_data:
        cust = {
            "name": name,
            "email": email,
            "password": hashed_pass,
            "phone": f"+91 {random.randint(7000000000, 9999999999)}",
            "created_at": datetime.now() - timedelta(days=random.randint(30, 90))
        }
        res = await db["customers"].insert_one(cust)
        cust["_id"] = res.inserted_id
        customers.append(cust)
    print(f"Inserted {len(customers)} customers.")

    # 3. Seed Orders & Bills (3-5 per customer)
    for cust in customers:
        num_orders = random.randint(3, 5)
        for i in range(num_orders):
            # Select 1-4 random medicines
            order_meds = random.sample(medicines, random.randint(1, 4))
            med_list = []
            total_amount = 0
            
            for m in order_meds:
                qty = random.randint(1, 3)
                price = m["selling_price"]
                med_list.append({
                    "medicine_id": str(m["_id"]),
                    "name": m["name"],
                    "quantity": qty,
                    "price": price
                })
                total_amount += price * qty
            
            order_date = datetime.now() - timedelta(days=random.randint(1, 30))
            
            # Create Order
            order = {
                "customer_id": str(cust["_id"]),
                "medicines": med_list,
                "total_amount": round(total_amount, 2),
                "order_date": order_date
            }
            res_order = await db["orders"].insert_one(order)
            
            # Create corresponding Bill
            subtotal = total_amount
            tax = round(subtotal * 0.05, 2)
            bill = {
                "bill_id": f"BILL-{random.randint(10000, 99999)}",
                "customer_id": str(cust["_id"]),
                "order_id": str(res_order.inserted_id),
                "medicines": med_list,
                "subtotal": round(subtotal, 2),
                "tax": tax,
                "total": round(subtotal + tax, 2),
                "created_at": order_date
            }
            await db["bills"].insert_one(bill)
            
    # 4. Seed Inventory Logs (One for each medicine's initial stock)
    print("Seeding inventory logs...")
    admin_user = await db["users"].find_one({"role": "Admin"})
    for med in medicines:
        log = {
            "medicine_id": str(med["_id"]),
            "medicine_name": med["name"],
            "type": "stock_in",
            "quantity": med["stock"],
            "previous_stock": 0,
            "updated_stock": med["stock"],
            "performed_by": str(admin_user["_id"]),
            "performed_by_name": admin_user["name"],
            "performed_by_role": "Admin",
            "reason": "Initial stock seeding",
            "batch_number": med["batch_number"],
            "expiry_date": med["expiry_date"],
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 60))
        }
        await db["inventory_logs"].insert_one(log)
    print(f"Inserted {len(medicines)} inventory logs.")

    # 5. Seed Suppliers (5)
    print("Seeding suppliers...")
    suppliers_list = [
        {"name": "Cipla Ltd", "contact": "Mr. Sharma (9876543210)", "address": "Mumbai, India"},
        {"name": "Sun Pharma", "contact": "Ms. Gupta (8765432109)", "address": "Ahmedabad, India"},
        {"name": "Dr. Reddys", "contact": "Mr. Reddy (7654321098)", "address": "Hyderabad, India"},
        {"name": "GSK Pharma", "contact": "Mr. Watson (6543210987)", "address": "London, UK"},
        {"name": "Pfizer Inc", "contact": "Ms. Doe (5432109876)", "address": "New York, USA"}
    ]
    for s in suppliers_list:
        s["created_at"] = datetime.now(timezone.utc)
        await db["suppliers"].insert_one(s)
    print(f"Inserted {len(suppliers_list)} suppliers.")

    print("Database seeding completed successfully.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_data())
