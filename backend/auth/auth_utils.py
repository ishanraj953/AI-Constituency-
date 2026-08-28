import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from backend.database.mongodb import users_collection

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (jwt.InvalidTokenError, jwt.PyJWTError, Exception):
        raise credentials_exception
    
    clean_email = email.strip().lower()
    user = users_collection.find_one({"email": clean_email})
    if user is None:
        # Fallback to case-insensitive match if direct lowercase match didn't find it
        user = users_collection.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        
    if user is None:
        raise credentials_exception

    # Ensure user_id is always present
    if "user_id" not in user or not user["user_id"]:
        user["user_id"] = str(user.get("_id", ""))

    return user

def require_admin(current_user: dict = Depends(get_current_user)):
    role = str(current_user.get("role", "")).upper()
    if role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges. Administrator access required."
        )
    return current_user

def require_admin_or_staff(current_user: dict = Depends(get_current_user)):
    role = str(current_user.get("role", "")).upper()
    if role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges. Staff or Administrator access required."
        )
    return current_user


