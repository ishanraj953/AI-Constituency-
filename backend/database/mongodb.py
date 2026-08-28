import os
import certifi
import urllib.parse
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

raw_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("DATABASE_NAME", "ai_constituency")

def sanitize_mongo_uri(uri_str: str) -> str:
    if not uri_str:
        return "mongodb://localhost:27017"
    if "mongodb+srv://" in uri_str or "mongodb://" in uri_str:
        prefix = "mongodb+srv://" if "mongodb+srv://" in uri_str else "mongodb://"
        remainder = uri_str[len(prefix):]
        if "@" in remainder:
            parts = remainder.split("@")
            if len(parts) > 2:
                host_part = parts[-1]
                user_pass_part = "@".join(parts[:-1])
                if ":" in user_pass_part:
                    user_part, pass_part = user_pass_part.split(":", 1)
                    enc_pass = urllib.parse.quote_plus(pass_part)
                    enc_user = urllib.parse.quote_plus(user_part)
                    return f"{prefix}{enc_user}:{enc_pass}@{host_part}"
    return uri_str

clean_uri = sanitize_mongo_uri(raw_uri)

# Test primary connection (Atlas or configured URI)
def get_connected_db():
    is_cloud = "mongodb+srv://" in clean_uri or "mongodb.net" in clean_uri
    client_kwargs = {
        "serverSelectionTimeoutMS": 3000,
    }
    if is_cloud:
        try:
            client_kwargs["tlsCAFile"] = certifi.where()
        except Exception:
            pass

    try:
        c = MongoClient(clean_uri, **client_kwargs)
        # Verify active connection with ping
        c.admin.command('ping')
        print(f"[Database] Successfully connected to MongoDB: {clean_uri.split('@')[-1] if '@' in clean_uri else 'configured endpoint'}")
        return c[db_name]
    except Exception as e:
        print(f"[Database Warning] Could not connect to primary MongoDB Atlas: {e}")
        print("[Database Notice] To enable MongoDB Atlas, ensure '0.0.0.0/0' (Allow from Anywhere) is added to Network Access in MongoDB Atlas console.")
        print("[Database Fallback] Using local MongoDB on mongodb://localhost:27017 for seamless operation.")
        try:
            local_client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
            local_client.admin.command('ping')
            return local_client[db_name]
        except Exception as local_err:
            print(f"[Database Fallback Error] Local MongoDB also unavailable: {local_err}")
            return c[db_name]

db = get_connected_db()

complaints_collection = db["complaints"]
users_collection = db["users"]