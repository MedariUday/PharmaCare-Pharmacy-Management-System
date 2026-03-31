import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.database.mongodb import get_database, connect_to_mongo, close_mongo_connection

async def list_staff():
    try:
        await connect_to_mongo()
        db = get_database()
        # Case insensitive role search
        users = await db["users"].find({"role": {"$regex": "^staff$", "$options": "i"}}).to_list(10)
        print(f"--- STAFF USERS ---")
        for u in users:
            print(f"Email: {u['email']} | Role: {u['role']}")
        await close_mongo_connection()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_staff())
