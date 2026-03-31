import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def migrate_data():
    local_uri = "mongodb://localhost:27017"
    atlas_uri = "mongodb+srv://udaymedari2005_db_user:PharmaCare2026@user.gbdsxyr.mongodb.net/pharmacy_db?retryWrites=true&w=majority"
    
    local_client = AsyncIOMotorClient(local_uri)
    atlas_client = AsyncIOMotorClient(atlas_uri)
    
    local_db = local_client["pharmacy_db"]
    atlas_db = atlas_client["pharmacy_db"]
    
    collections = ["medicines", "customers", "suppliers", "users", "inventory_logs", "orders", "bills", "carts"]
    
    print("🚀 Starting Data Migration to Atlas...")
    
    for coll_name in collections:
        try:
            print(f"📦 Migrating: {coll_name}...")
            # Fetch local records
            local_records = await local_db[coll_name].find({}).to_list(1000)
            if not local_records:
                print(f"  - No records found locally in '{coll_name}'. Skipping.")
                continue
            
            print(f"  - Found {len(local_records)} records locally.")
            
            # Clear Atlas records for this collection
            await atlas_db[coll_name].delete_many({})
            
            # Insert into Atlas
            await atlas_db[coll_name].insert_many(local_records)
            print(f"  ✅ Successfully migrated {len(local_records)} records to Atlas.")
            
        except Exception as e:
            print(f"  ❌ Error migrating '{coll_name}': {e}")
            
    print("\n🏁 Data Migration Completed successfully!")
    local_client.close()
    atlas_client.close()

if __name__ == "__main__":
    asyncio.run(migrate_data())
