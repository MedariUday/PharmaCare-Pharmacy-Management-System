from datetime import datetime, timezone
from app.database.mongodb import get_database
from app.utils.password_hash import get_password_hash
from bson import ObjectId

def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
        "created_by": user.get("created_by")
    }

async def add_user(user_data: dict, creator_id: str = None) -> dict:
    db = get_database()
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["created_at"] = datetime.now(timezone.utc)
    user_data["is_active"] = user_data.get("is_active", True)
    if creator_id:
        user_data["created_by"] = creator_id
    
    user = await db["users"].insert_one(user_data)
    new_user = await db["users"].find_one({"_id": user.inserted_id})
    return user_helper(new_user)

async def update_user(id: str, data: dict) -> bool:
    if len(data) < 1:
        return False
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(id)})
    if user:
        updated_user = await db["users"].update_one(
            {"_id": ObjectId(id)}, {"$set": data}
        )
        return True if updated_user else False
    return False

async def retrieve_all_users() -> list:
    db = get_database()
    users = []
    async for user in db["users"].find():
        users.append(user_helper(user))
    return users

async def retrieve_user(id: str) -> dict:
    db = get_database()
    user = await db["users"].find_one({"_id": ObjectId(id)})
    if user:
        return user_helper(user)

async def retrieve_user_by_email(email: str) -> dict:
    db = get_database()
    return await db["users"].find_one({"email": email})

async def get_user_counts_by_role() -> dict:
    db = get_database()
    pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    cursor = db["users"].aggregate(pipeline)
    res = await cursor.to_list(10)
    return {item["_id"]: item["count"] for item in res}
