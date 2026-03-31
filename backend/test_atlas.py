import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_connection():
    uri = "mongodb+srv://udaymedari2005_db_user:J0Gbg0VzSHQRcy6E@user.gbdsxyr.mongodb.net/?appName=User&tlsAllowInvalidCertificates=true"
    print(f"Testing connection to: {uri.split('@')[1]}")
    try:
        client = AsyncIOMotorClient(uri)
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("✅ MongoDB Atlas connection successful!")
        
        # List databases to verify access
        db_names = await client.list_database_names()
        print(f"Databases found: {db_names}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
