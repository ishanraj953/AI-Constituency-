import os
import io
import uuid
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUD_NAME") or os.getenv("CLOUDINARY_CLOUD_NAME") or "dh3ros2yj"
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "667858161132876")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "HRfWja4zvFle4yOKx3nriQDJybY")

# Configure cloudinary SDK
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

def upload_image_to_cloudinary(image_bytes: bytes, filename: str = None) -> str:
    """
    Uploads raw image bytes to Cloudinary.
    Returns the Cloudinary HTTPS secure_url on success, or None on failure.
    """
    if not image_bytes:
        return None

    try:
        public_id = f"grievance_{uuid.uuid4().hex[:12]}"
        
        # Ensure config is loaded
        c_name = os.getenv("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME)
        c_key = os.getenv("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY)
        c_secret = os.getenv("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET)
        
        cloudinary.config(
            cloud_name=c_name,
            api_key=c_key,
            api_secret=c_secret,
            secure=True
        )

        upload_result = cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            folder="ai_constituency/complaints",
            public_id=public_id,
            resource_type="image",
            overwrite=True
        )

        secure_url = upload_result.get("secure_url") or upload_result.get("url")
        if secure_url:
            print(f"[Cloudinary] Image uploaded successfully: {secure_url}")
            return secure_url

    except Exception as e:
        print(f"[Cloudinary] Upload notice/fallback: {e}")

    return None
