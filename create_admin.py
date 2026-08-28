import os
import sys
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Ensure root dir in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database.mongodb import users_collection
from backend.auth.auth_utils import get_password_hash

load_dotenv()

def create_admin(name="Administrator", email="admin@example.com", password="adminpassword"):
    clean_email = email.strip().lower()
    print("=" * 60)
    print("AI Constituency - Admin User Setup Tool")
    print("=" * 60)
    print(f"Target Email   : {clean_email}")
    print(f"Admin Name     : {name}")

    try:
        existing = users_collection.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        hashed = get_password_hash(password)

        if existing:
            users_collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "name": name,
                        "password_hash": hashed,
                        "role": "ADMIN",
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            print("Status         : SUCCESS - Existing account updated to ADMIN role with new password.")
        else:
            user_id = str(uuid.uuid4())
            users_collection.insert_one({
                "user_id": user_id,
                "name": name,
                "email": clean_email,
                "password_hash": hashed,
                "role": "ADMIN",
                "created_at": datetime.now(timezone.utc)
            })
            print("Status         : SUCCESS - New ADMIN account created.")

        print("\nAdmin Credentials:")
        print(f"  Email    : {clean_email}")
        print(f"  Password : {password}")
        print(f"  Role     : ADMIN")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n[ERROR] Failed to set up admin: {e}")
        return False

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@example.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "adminpassword"
    name = sys.argv[3] if len(sys.argv) > 3 else "Administrator"
    create_admin(name=name, email=email, password=password)

