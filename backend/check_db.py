import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['pharmacy_db']
    
    print('Users:', await db.users.count_documents({}))
    print('Medicines:', await db.medicines.count_documents({}))
    print('Customers:', await db.customers.count_documents({}))
    print('Suppliers:', await db.suppliers.count_documents({}))
    print('Sales:', await db.sales.count_documents({}))
    print('Inventory Logs:', await db.inventory_logs.count_documents({}))
    
if __name__ == '__main__':
    asyncio.run(check())
