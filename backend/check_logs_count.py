import asyncio
import os
import sys

# Add the app directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

from app.database.mongodb import connect_to_mongo, get_database, close_mongo_connection

async def check_logs():
    await connect_to_mongo()
    db = get_database()
    count = await db["inventory_logs"].count_documents({})
    print(f"DEBUG_INVENTORY_LOGS_COUNT: {count}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_logs())
