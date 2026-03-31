from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.utils.jwt_handler import verify_access_token
from app.models.user_model import retrieve_user
from app.models.customer_model import retrieve_customer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        raise _credentials_exception
    payload = verify_access_token(token)
    if payload is None:
        raise _credentials_exception
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    
    if user_id is None:
        raise _credentials_exception
    
    if role == "Customer":
        user = await retrieve_customer(user_id)
    else:
        user = await retrieve_user(user_id)
        
    if user is None:
        raise _credentials_exception
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions. Requires Admin.")
    return current_user

async def get_current_pharmacist(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Admin", "Pharmacist"]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Requires Pharmacist or Admin.")
    return current_user

async def get_current_staff(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["Admin", "Pharmacist", "Staff"]:
        raise HTTPException(status_code=403, detail="Not enough permissions. Requires Staff, Pharmacist, or Admin.")
    return current_user

async def get_current_customer(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        raise _credentials_exception
    payload = verify_access_token(token)
    if payload is None:
        raise _credentials_exception
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    
    if user_id is None or role != "Customer":
        raise _credentials_exception
        
    customer = await retrieve_customer(user_id)
    if customer is None:
        raise _credentials_exception
    return customer

