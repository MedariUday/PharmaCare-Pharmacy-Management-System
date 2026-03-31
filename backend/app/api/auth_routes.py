from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user_schema import UserCreate, UserResponse, UserLogin
from app.models.user_model import add_user, retrieve_user_by_email, user_helper
from app.utils.password_hash import verify_password
from app.utils.jwt_handler import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    if user.role != "Customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only Customer accounts can be self-registered. Please contact Admin for Staff/Pharmacist accounts."
        )
    
    existing_user = await retrieve_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = await add_user(user.model_dump())
    return new_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await retrieve_user_by_email(form_data.username)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact administrator.")
    
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id, "role": user.get("role", "Staff")})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.get("role", "Staff"), 
        "name": user.get("name"),
        "userId": user_id
    }
