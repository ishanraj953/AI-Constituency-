import os
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from backend.database.mongodb import users_collection
from backend.auth.auth_utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from datetime import timedelta, datetime, timezone
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "ADMIN@CONSTITUENCY2026")
STAFF_SECRET_KEY = os.getenv("STAFF_SECRET_KEY", "STAFF@CONSTITUENCY2026")

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "USER" # USER, STAFF, ADMIN
    department: Optional[str] = None
    designation: Optional[str] = None
    secret_key: Optional[str] = None

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
    if clean_role not in ["USER", "STAFF", "ADMIN"]:
        clean_role = "USER"

    # Security Key validation for ADMIN and STAFF
    if clean_role == "ADMIN":
        if not user.secret_key or user.secret_key.strip() != ADMIN_SECRET_KEY:
            raise HTTPException(
                status_code=403,
                detail=f"Invalid Administrator Security Key. Authorization key required to register as MP Administrator."
            )
    elif clean_role == "STAFF":
        if not user.secret_key or user.secret_key.strip() != STAFF_SECRET_KEY:
            raise HTTPException(
                status_code=403,
                detail=f"Invalid Staff Security Key. Department authorization key required to register as Department Officer."
            )
        if not user.department or not user.department.strip():
            raise HTTPException(
                status_code=400,
                detail="Please select your assigned Government Department."
            )

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
    now = datetime.now(timezone.utc)

    user_dict = {
        "user_id": user_id,
        "name": user.name.strip(),
        "email": clean_email,
        "password_hash": hashed_password,
        "role": clean_role,
        "department": user.department.strip() if user.department else None,
        "designation": user.designation.strip() if user.designation else ("Department Staff" if clean_role == "STAFF" else None),
        "created_at": now
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
        "role": clean_role,
        "department": user_dict.get("department"),
        "designation": user_dict.get("designation")
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
    user_dept = user.get("department")
    user_desig = user.get("designation")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_email, "role": user_role, "user_id": user_id},
        expires_delta=access_token_expires
    )
    
    user_info = {
        "user_id": user_id,
        "name": user_name,
        "email": user_email,
        "role": user_role,
        "department": user_dept,
        "designation": user_desig
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user_info = {
        "user_id": current_user.get("user_id", str(current_user.get("_id", ""))),
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": str(current_user.get("role", "USER")).upper(),
        "department": current_user.get("department"),
        "designation": current_user.get("designation")
    }
    return user_info

@router.get("/staff")
def list_department_staff(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"role": "STAFF"}
    if department and department not in ["All", "All Departments"]:
        query["department"] = {"$regex": f"^{department.strip()}$", "$options": "i"}

    staff_list = list(users_collection.find(
        query,
        {
            "_id": 0,
            "password_hash": 0
        }
    ))

    return {
        "count": len(staff_list),
        "department": department,
        "staff": staff_list
    }

