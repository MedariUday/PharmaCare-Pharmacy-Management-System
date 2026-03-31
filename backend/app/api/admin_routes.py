from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user_schema import UserCreate, UserResponse, UserUpdate
from app.models.user_model import add_user, retrieve_all_users, retrieve_user, update_user
from app.api.deps import get_current_admin
from app.utils.password_hash import get_password_hash
import secrets
import string

router = APIRouter(prefix="/api/admin/users", tags=["Admin User Management"])

@router.post("/", response_model=UserResponse)
async def admin_create_user(user: UserCreate, current_admin: dict = Depends(get_current_admin)):
    # Check if email already exists
    from app.models.user_model import retrieve_user_by_email
    existing_user = await retrieve_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with creator attribution
    new_user = await add_user(user.model_dump(), creator_id=current_admin["id"])
    return new_user

@router.get("/", response_model=list[UserResponse])
async def list_users(current_admin: dict = Depends(get_current_admin)):
    return await retrieve_all_users()

@router.patch("/{id}", response_model=UserResponse)
async def update_user_details(id: str, data: UserUpdate, current_admin: dict = Depends(get_current_admin)):
    updated = await update_user(id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found or no changes made")
    
    user = await retrieve_user(id)
    return user

@router.post("/{id}/reset-password")
async def reset_user_password(id: str, current_admin: dict = Depends(get_current_admin)):
    # Generate random 12-char password
    alphabet = string.ascii_letters + string.digits
    new_password = ''.join(secrets.choice(alphabet) for i in range(12))
    
    hashed_password = get_password_hash(new_password)
    updated = await update_user(id, {"password": hashed_password})
    
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password reset successful", "temporary_password": new_password}

@router.get("/generate-password")
async def generate_random_password(current_admin: dict = Depends(get_current_admin)):
    """Generate a strong password: uppercase + lowercase + digits + symbol."""
    import random
    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    digits = string.digits
    symbols = "!@#$"
    # Guarantee at least one of each required character class
    guaranteed = [
        secrets.choice(upper),
        secrets.choice(lower),
        secrets.choice(digits),
        secrets.choice(symbols),
    ]
    # Fill remaining 8 chars from combined pool
    pool = upper + lower + digits + symbols
    rest = [secrets.choice(pool) for _ in range(8)]
    password_chars = guaranteed + rest
    random.shuffle(password_chars)
    return {"password": ''.join(password_chars)}
