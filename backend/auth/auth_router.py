from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from backend.database.mongodb import users_collection
from backend.auth.auth_utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from datetime import timedelta
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "USER" # Can be USER or ADMIN

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    clean_email = str(user.email).strip().lower()
    clean_role = str(user.role).strip().upper() if user.role else "USER"
    if clean_role not in ["USER", "ADMIN"]:
        clean_role = "USER"

    existing_user = users_collection.find_one({
        "email": {"$regex": f"^{clean_email}$", "$options": "i"}
    })
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please sign in instead."
        )
    
    hashed_password = get_password_hash(user.password)
    user_id = str(uuid.uuid4())
    user_dict = {
        "user_id": user_id,
        "name": user.name.strip(),
        "email": clean_email,
        "password_hash": hashed_password,
        "role": clean_role
    }
    
    users_collection.insert_one(user_dict)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": clean_email, "role": clean_role, "user_id": user_id},
        expires_delta=access_token_expires
    )
    
    user_info = {
        "user_id": user_id,
        "name": user_dict["name"],
        "email": clean_email,
        "role": clean_role
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    clean_email = str(user_credentials.email).strip().lower()
    user = users_collection.find_one({"email": clean_email})
    if not user:
        user = users_collection.find_one({
            "email": {"$regex": f"^{clean_email}$", "$options": "i"}
        })

    if not user or not verify_password(user_credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = user.get("user_id", str(user.get("_id", "")))
    user_role = str(user.get("role", "USER")).upper()
    user_email = user.get("email", clean_email)
    user_name = user.get("name", "")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_email, "role": user_role, "user_id": user_id},
        expires_delta=access_token_expires
    )
    
    user_info = {
        "user_id": user_id,
        "name": user_name,
        "email": user_email,
        "role": user_role
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user_info = {
        "user_id": current_user.get("user_id", str(current_user.get("_id", ""))),
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": str(current_user.get("role", "USER")).upper()
    }
    return user_info

