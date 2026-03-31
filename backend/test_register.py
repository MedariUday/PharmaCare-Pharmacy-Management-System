import asyncio
import os
import sys

# Add app to path
sys.path.append(os.path.join(os.getcwd(), 'app'))

async def test():
    try:
        from app.database.mongodb import connect_to_mongo, get_database
        from app.models.user_model import add_user
        from app.config import settings
        
        print(f"Connecting to {settings.MONGODB_URL}...")
        await connect_to_mongo()
        db = get_database()
        
        test_user = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "role": "Admin"
        }
        
        print("Adding user...")
        result = await add_user(test_user)
        print("Success:", result)
        
    except Exception as e:
        print("Error during registration:", str(e))
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test())
