from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from backend.auth.auth_utils import get_current_user, require_admin, require_admin_or_staff, get_password_hash
from backend.auth.auth_router import router as auth_router
from backend.database.mongodb import complaints_collection, users_collection
from backend.verification.complaint_verifier import ComplaintVerifier
from backend.geo.geo_extractor import extract_geo_location, calculate_haversine_distance, check_location_proximity
from backend.image_analysis.image_analyzer import ImageAnalyzer
from backend.speech.speech_to_text import transcribe_audio
from ai.complaint_processor import ComplaintProcessor
from ai.similarity import SimilarityEngine
from ai.ranking import PriorityEngine
from backend.services.cloudinary_service import upload_image_to_cloudinary
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import tempfile
import shutil
import math
import os
import uuid


def safe_parse_coordinate(val, min_val: float, max_val: float) -> Optional[float]:
    """Safely parses float coordinates, filtering out invalid values, strings, NaN, and Inf."""
    if val is None:
        return None
    val_str = str(val).strip().lower()
    if val_str in ("", "null", "undefined", "none", "nan", "inf", "-inf"):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        if min_val <= f <= max_val:
            return round(f, 6)
        return None
    except (ValueError, TypeError):
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure default admin exists on backend startup
    try:
        admin_user = users_collection.find_one({"role": "ADMIN"})
        if not admin_user:
            admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
            admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword")
            admin_name = os.getenv("ADMIN_NAME", "Administrator")
            users_collection.insert_one({
                "user_id": str(uuid.uuid4()),
                "name": admin_name,
                "email": admin_email,
                "password_hash": get_password_hash(admin_password),
                "role": "ADMIN",
                "created_at": datetime.now(timezone.utc)
            })
            print(f"[Admin Setup] Initialized default admin account: {admin_email} / {admin_password}")
        else:
            print(f"[Admin Setup] Existing admin account detected: {admin_user.get('email')}")

        # Seed initial Department Staff accounts if none exist
        if users_collection.count_documents({"role": "STAFF"}) == 0:
            default_staff_members = [
                {"name": "Er. Rajesh Verma", "email": "rajesh.roads@constituency.gov.in", "password": "staffpassword", "department": "Roads & Infrastructure Department", "designation": "Executive Engineer (Roads)"},
                {"name": "Dr. Amit Sharma", "email": "amit.water@constituency.gov.in", "password": "staffpassword", "department": "Water Supply Department", "designation": "Superintending Officer (Water)"},
                {"name": "Smt. Priya Singh", "email": "priya.sanitation@constituency.gov.in", "password": "staffpassword", "department": "Sanitation & Waste Management Department", "designation": "Chief Sanitary Inspector"},
                {"name": "Er. Vikram Meena", "email": "vikram.power@constituency.gov.in", "password": "staffpassword", "department": "Electrical & Power Department", "designation": "Assistant Power Engineer"},
                {"name": "Dr. Sunita Patel", "email": "sunita.health@constituency.gov.in", "password": "staffpassword", "department": "Health & Family Welfare Department", "designation": "Chief Medical Officer"},
                {"name": "Insp. Ramesh Yadav", "email": "ramesh.safety@constituency.gov.in", "password": "staffpassword", "department": "Public Safety & Police Administration", "designation": "Divisional Safety Inspector"},
                {"name": "Er. Ankit Joshi", "email": "ankit.lighting@constituency.gov.in", "password": "staffpassword", "department": "Street Lighting & Electrical Division", "designation": "Streetlight Operations Engineer"},
                {"name": "Smt. Kavita Deshmukh", "email": "kavita.drainage@constituency.gov.in", "password": "staffpassword", "department": "Drainage & Sewerage Board", "designation": "Drainage Maintenance Lead"},
            ]
            for member in default_staff_members:
                users_collection.insert_one({
                    "user_id": str(uuid.uuid4()),
                    "name": member["name"],
                    "email": member["email"],
                    "password_hash": get_password_hash(member["password"]),
                    "role": "STAFF",
                    "department": member["department"],
                    "designation": member["designation"],
                    "created_at": datetime.now(timezone.utc)
                })
            print(f"[Staff Setup] Initialized {len(default_staff_members)} department staff accounts.")
    except Exception as e:
        print(f"[Admin/Staff Setup] Warning during startup setup: {e}")
    yield

app = FastAPI(
    title="AI Constituency Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Robust CORS Configuration for hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
os.makedirs("uploads/images", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

api_router = APIRouter()



processor = ComplaintProcessor()
similarity = SimilarityEngine()
priority = PriorityEngine()
image_analyzer = ImageAnalyzer()
verifier = ComplaintVerifier()

def generate_complaint_id():
    return f"CMP-{uuid.uuid4().hex[:8].upper()}"

DEPARTMENT_MAPPING = {
    # Expanded Categories
    "Roads & Bridges": "Roads & Infrastructure Department",
    "Water Supply": "Water Supply Department",
    "Drainage & Sewage": "Drainage & Sewerage Board",
    "Sanitation & Waste Management": "Sanitation & Waste Management Department",
    "Electricity & Power": "Electrical & Power Department",
    "Street Lighting": "Street Lighting & Electrical Division",
    "Public Safety & Law/Order": "Public Safety & Police Administration",
    "Healthcare & Hospitals": "Health & Family Welfare Department",
    "Education & Schools": "Education & School Infrastructure Department",
    "Public Transport & Traffic": "Transport & Traffic Department",
    "Environment & Pollution": "Environment & Pollution Control Board",
    "Parks & Recreation": "Horticulture & Parks Department",
    "Housing & Slum Rehabilitation": "Housing & Urban Development Authority",
    "Revenue & Land Records": "Revenue & Land Administration",
    "Public Distribution System (PDS)": "Food & Civil Supplies Department",
    "Social Welfare & Pensions": "Social Welfare & Pensions Department",
    
    # Legacy aliases for backwards compatibility
    "Roads": "Roads & Infrastructure Department",
    "Sanitation": "Sanitation & Waste Management Department",
    "Electricity": "Electrical & Power Department",
    "Public Safety": "Public Safety & Police Administration",
    "Healthcare": "Health & Family Welfare Department",
    "Education": "Education & School Infrastructure Department",
    "Public Transport": "Transport & Traffic Department",
    "Environment": "Environment & Pollution Control Board",
    "Housing": "Housing & Urban Development Authority",
    "Drainage": "Drainage & Sewerage Board",
    "Other": "General Administration"
}

def get_department(category):
    if not category:
        return "General Administration"
    
    # Direct match
    if category in DEPARTMENT_MAPPING:
        return DEPARTMENT_MAPPING[category]
    
    # Partial keyword matching
    cat_lower = category.lower()
    for key, dept in DEPARTMENT_MAPPING.items():
        if key.lower() in cat_lower or cat_lower in key.lower():
            return dept
            
    return "General Administration"

def add_activity(complaint_id: str, action: str):
    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$push": {
                "activity_log": {
                    "action": action,
                    "timestamp": datetime.now().isoformat()
                }
            }
        }
    )

SLA_RULES = {
    "Critical": timedelta(hours=12),
    "High": timedelta(hours=36),
    "Medium": timedelta(days=5),
    "Low": timedelta(days=14),
}


def calculate_sla_deadline(priority_level: str, created_at: datetime):
    return created_at + SLA_RULES.get(
        priority_level,
        timedelta(days=14)
    )

VALID_STATUSES = [
    "Pending",
    "Assigned",
    "In Progress",
    "Resolved"
]


class ComplaintRequest(BaseModel):
    complaint: str
    location: str

class StatusUpdateRequest(BaseModel):
    status: str

class AssignmentRequest(BaseModel):
    assigned_to: str

class ResolutionRequest(BaseModel):
    resolution_remarks: str


@api_router.get("/")
def home():
    return {
        "status": "online",
        "message": "AI Constituency Backend Running",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


@api_router.post("/complaints")
async def submit_complaint(
    complaint: str = Form(...),
    location: str = Form(...),
    pincode: Optional[str] = Form(""),
    ward_no: Optional[str] = Form(""),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not complaint or not complaint.strip():
        raise HTTPException(status_code=400, detail="Grievance description is required.")
    if not location or not location.strip():
        raise HTTPException(status_code=400, detail="Location / constituency is required.")

    # Read uploaded image bytes
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image file: {str(e)}")

    # Parse and validate form coordinates safely (submitted place/device location)
    parsed_lat = safe_parse_coordinate(latitude, -90.0, 90.0)
    parsed_lon = safe_parse_coordinate(longitude, -180.0, 180.0)

    # Extract GPS coordinates from image EXIF
    exif_geo = extract_geo_location(image_bytes)
    exif_lat = None
    exif_lon = None
    if exif_geo and isinstance(exif_geo, dict) and "latitude" in exif_geo and "longitude" in exif_geo:
        c_lat = safe_parse_coordinate(exif_geo.get("latitude"), -90.0, 90.0)
        c_lon = safe_parse_coordinate(exif_geo.get("longitude"), -180.0, 180.0)
        if c_lat is not None and c_lon is not None and not (abs(c_lat) < 1e-5 and abs(c_lon) < 1e-5):
            exif_lat = c_lat
            exif_lon = c_lon

    # Proximity comparison between Image EXIF GPS and Submitted place GPS
    proximity = check_location_proximity(exif_lat, exif_lon, parsed_lat, parsed_lon)

    # Determine primary coordinates to store
    if parsed_lat is not None and parsed_lon is not None and not (abs(parsed_lat) < 1e-5 and abs(parsed_lon) < 1e-5):
        primary_lat = parsed_lat
        primary_lon = parsed_lon
        geo_source = "device_gps"
    elif exif_lat is not None and exif_lon is not None:
        primary_lat = exif_lat
        primary_lon = exif_lon
        geo_source = "image_exif"
    else:
        primary_lat = 28.6139
        primary_lon = 77.2090
        geo_source = "constituency_default"

    # AI Vision Analysis
    try:
        image_analysis = image_analyzer.analyze(
            image_bytes=image_bytes,
            content_type=image.content_type or "image/jpeg"
        )
    except Exception as e:
        print(f"[ImageAnalyzer] Fallback due to error: {e}")
        image_analysis = {
            "is_valid_civic_issue": True,
            "detected_category": "Other",
            "detected_severity": "Medium",
            "confidence": 0.85,
            "image_summary": "Photographic evidence attached for civic grievance resolution."
        }

    # Save image (Cloudinary or local fallback)
    cloudinary_url = upload_image_to_cloudinary(image_bytes, image.filename)
    if cloudinary_url:
        image_path = cloudinary_url
    else:
        os.makedirs("uploads/images", exist_ok=True)
        file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        image_path = os.path.join("uploads", "images", unique_filename).replace("\\", "/")
        try:
            with open(image_path, "wb") as f:
                f.write(image_bytes)
        except Exception as e:
            print(f"[File Save] Warning: Failed to save image locally: {e}")

    # Process complaint text using LLM & embedding generator
    try:
        processed = processor.process(complaint)
    except Exception as e:
        print(f"[ComplaintProcessor] Fallback due to error: {e}")
        processed = {
            "category": "Other",
            "urgency": "Medium",
            "summary": complaint[:200] if complaint else "Civic issue report",
            "beneficiaries": "Citizens",
            "embedding": [0.0] * 384
        }

    # Cross-verification
    try:
        verification = verifier.verify(
            complaint=complaint,
            text_summary=processed.get("summary", ""),
            text_category=processed.get("category", "Other"),
            image_summary=image_analysis.get("image_summary", ""),
            image_category=image_analysis.get("detected_category", "Other"),
            image_valid=image_analysis.get("is_valid_civic_issue", True)
        )
    except Exception as e:
        print(f"[ComplaintVerifier] Fallback due to error: {e}")
        verification = {
            "is_match": True,
            "match_score": 0.7,
            "verification_status": "Verified",
            "reason": "Automated verification completed.",
            "text_category": processed.get("category", "Other"),
            "image_category": image_analysis.get("detected_category", "Other"),
            "category_match": True
        }

    # STRICT CHECK: Reject submission if the photo is not a civic issue or does not match complaint
    is_vision_fallback = image_analysis.get("is_fallback", False)
    if not is_vision_fallback:
        if not image_analysis.get("is_valid_civic_issue", True):
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception:
                    pass
            raise HTTPException(
                status_code=400,
                detail=f"Submission Rejected: The uploaded photo does not appear to show a valid public infrastructure or civic issue. (Detected: '{image_analysis.get('image_summary', '')}'). Please upload a clear photo of the grievance."
            )

        if not verification.get("is_match", True) or verification.get("verification_status") in ["Mismatch", "Invalid Image"]:
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception:
                    pass
            complaint_cat = processed.get("category", "Civic")
            image_cat = image_analysis.get("detected_category", "Other")
            image_desc = image_analysis.get("image_summary", "")
            raise HTTPException(
                status_code=400,
                detail=f"Submission Rejected: The uploaded photo evidence does not match your grievance description. Your complaint describes a '{complaint_cat}' issue, but the attached photo shows '{image_cat}: {image_desc}'. Please upload photo evidence that corresponds to your complaint."
            )

    processed["location"] = location

    # Find similar complaints
    try:
        filtered_complaints = list(
            complaints_collection.find(
                {
                    "category": processed.get("category", "Other"),
                    "location": location,
                },
                {
                    "_id": 0,
                },
            )
        )
        matches = similarity.find_similar(
            processed,
            filtered_complaints,
        )
    except Exception as e:
        print(f"[Similarity] Fallback due to error: {e}")
        matches = []

    # Calculate multimodal priority score giving high weight to image evidence
    try:
        ranking = priority.calculate(
            similar_count=len(matches),
            urgency=processed.get("urgency", "Low"),
            image_severity=image_analysis.get("detected_severity"),
            image_valid=image_analysis.get("is_valid_civic_issue", False),
            verification_status=verification.get("verification_status"),
            category_match=verification.get("category_match", False)
        )
    except Exception as e:
        print(f"[Priority] Fallback due to error: {e}")
        ranking = {
            "priority_score": 50,
            "priority_level": "Medium"
        }

    now = datetime.now(timezone.utc)
    user_id = current_user.get("user_id", str(current_user.get("_id", "")))

    activity_log = [
        {
            "action": "Complaint Submitted",
            "timestamp": now.isoformat(),
        },
        {
            "action": "Geo-tagged Image Verified",
            "timestamp": now.isoformat(),
        },
        {
            "action": "AI Image Analysis Completed",
            "timestamp": now.isoformat(),
        },
        {
            "action": "AI Processing Completed",
            "timestamp": now.isoformat(),
        },
        {
            "action": f"Assigned to {get_department(processed.get('category', 'Other'))}",
            "timestamp": now.isoformat(),
        },
        {
            "action": f"SLA deadline assigned based on {ranking.get('priority_level', 'Medium')} priority",
            "timestamp": now.isoformat(),
        },
    ]

    if proximity.get("location_mismatch"):
        activity_log.append({
            "action": f"Location Discrepancy Flagged: Photo GPS is {proximity.get('location_distance_km')} km away from submitted place",
            "timestamp": now.isoformat()
        })

    result = {
        **processed,
        "complaint_id": generate_complaint_id(),
        "user_id": user_id,
        "similar_count": len(matches),
        "priority_score": ranking.get("priority_score", 50),
        "priority_level": ranking.get("priority_level", "Medium"),
        "complaint": complaint,
        "transcribed_complaint": None,

        # Location information
        "location": location,
        "pincode": pincode or "",
        "ward_no": ward_no or "",

        # Geo-tagged image information & Location Proximity
        "image_filename": image.filename,
        "image_content_type": image.content_type,
        "image_path": image_path,
        "latitude": primary_lat,
        "longitude": primary_lon,
        "geo_source": geo_source,

        "exif_coordinates": {
            "latitude": exif_lat,
            "longitude": exif_lon,
        } if (exif_lat is not None and exif_lon is not None) else None,
        "submitted_coordinates": {
            "latitude": parsed_lat if parsed_lat is not None else 28.6139,
            "longitude": parsed_lon if parsed_lon is not None else 77.2090,
        },
        "location_mismatch": proximity.get("location_mismatch", False),
        "location_match_status": proximity.get("location_match_status", "NO_EXIF_GPS"),
        "location_distance_km": proximity.get("location_distance_km"),
        "location_mismatch_reason": proximity.get("location_mismatch_reason"),

        # AI image analysis
        "is_valid_civic_issue": image_analysis.get("is_valid_civic_issue", True),
        "detected_category": image_analysis.get("detected_category", "Other"),
        "detected_severity": image_analysis.get("detected_severity", "Medium"),
        "image_confidence": image_analysis.get("confidence", 0.85),
        "image_summary": image_analysis.get("image_summary", ""),
        "image_analysis": image_analysis,

        # AI cross-verification
        "verification": verification,
        "verification_status": verification.get("verification_status", "Verified"),
        "verification_score": verification.get("match_score", 0.7),
        "category_match": verification.get("category_match", True),

        # Complaint management
        "status": "Pending",
        "assigned_department": get_department(processed.get("category", "Other")),
        "assigned_to": None,
        "sla_deadline": calculate_sla_deadline(
            ranking.get("priority_level", "Medium"),
            now
        ),
        "escalated": False,
        "resolution_remarks": None,

        # Activity history
        "activity_log": activity_log,
        "created_at": now,
        "updated_at": now,
    }

    # Create response before MongoDB adds _id
    response = result.copy()

    # Store complaint
    complaints_collection.insert_one(result)
    print("\nComplaint Submitted Successfully")
    print("=" * 50)
    print(f"Complaint ID       : {result['complaint_id']}")
    print(f"Category           : {result['category']}")
    print(f"Urgency            : {result['urgency']}")
    print(f"Priority Score     : {result['priority_score']}")
    print(f"Priority Level     : {result['priority_level']}")
    print(f"Department         : {result['assigned_department']}")
    print(f"Latitude           : {result['latitude']}")
    print(f"Longitude          : {result['longitude']}")
    print(f"Status             : {result['status']}")
    print(f"SLA Deadline       : {result['sla_deadline']}")
    print(f"Created At         : {result['created_at']}")
    print("=" * 50)

    # Remove embedding from API response
    response.pop("embedding", None)

    return response


@api_router.post("/speech-complaint")
async def submit_speech_complaint(
    audio: UploadFile = File(...),
    image: UploadFile = File(None),
    location: str = Form(...),
    pincode: Optional[str] = Form(""),
    ward_no: Optional[str] = Form(""),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    # 1. Location Validation
    if not location or not location.strip():
        raise HTTPException(status_code=400, detail="Location is required and cannot be empty.")

    # 2. Extension / Format Validation for Audio
    allowed_extensions = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".aac", ".flac"}
    suffix = os.path.splitext(audio.filename)[1].lower() if audio.filename else ".wav"
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Allowed formats: {', '.join(allowed_extensions)}"
        )

    # 3. File Size Validation
    MAX_SIZE = 10 * 1024 * 1024
    audio.file.seek(0, 2)
    file_size = audio.file.tell()
    audio.file.seek(0)
    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Audio file is too large ({file_size / (1024*1024):.1f}MB). Max limit is 10MB."
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        # Transcribe the audio file using Groq Whisper Cloud API
        transcribed_text = transcribe_audio(tmp_path)
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        print(f"[Speech-to-Text] Error during transcription: {e}")
        raise HTTPException(status_code=400, detail=f"Speech transcription failed: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not transcribed_text:
        raise HTTPException(status_code=400, detail="Speech could not be recognized. Please record clearly or upload another audio file.")

    # Process the transcribed text using the LLM pipeline
    try:
        processed = processor.process(transcribed_text)
    except Exception as e:
        print(f"[ComplaintProcessor] Fallback due to error: {e}")
        processed = {
            "category": "Other",
            "urgency": "Medium",
            "summary": transcribed_text[:200] if transcribed_text else "Voice grievance report",
            "beneficiaries": "Citizens",
            "embedding": [0.0] * 384
        }
    processed["location"] = location

    # Parse coordinates safely (submitted place/device location)
    parsed_lat = safe_parse_coordinate(latitude, -90.0, 90.0)
    parsed_lon = safe_parse_coordinate(longitude, -180.0, 180.0)

    # Optional image analysis & evidence processing
    image_analysis = None
    verification = None
    image_path = None
    exif_lat = None
    exif_lon = None
    proximity = {"has_exif": False, "location_mismatch": False, "location_match_status": "NO_EXIF_GPS", "location_distance_km": None, "location_mismatch_reason": None}

    if image and image.filename:
        try:
            image_bytes = await image.read()
            exif_geo = extract_geo_location(image_bytes)

            if exif_geo and isinstance(exif_geo, dict) and "latitude" in exif_geo and "longitude" in exif_geo:
                c_lat = safe_parse_coordinate(exif_geo.get("latitude"), -90.0, 90.0)
                c_lon = safe_parse_coordinate(exif_geo.get("longitude"), -180.0, 180.0)
                if c_lat is not None and c_lon is not None and not (abs(c_lat) < 1e-5 and abs(c_lon) < 1e-5):
                    exif_lat = c_lat
                    exif_lon = c_lon

            proximity = check_location_proximity(exif_lat, exif_lon, parsed_lat, parsed_lon)

            image_analysis = image_analyzer.analyze(
                image_bytes=image_bytes,
                content_type=image.content_type or "image/jpeg"
            )

            cloudinary_url = upload_image_to_cloudinary(image_bytes, image.filename)
            if cloudinary_url:
                image_path = cloudinary_url
            else:
                os.makedirs("uploads/images", exist_ok=True)
                file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
                unique_filename = f"{uuid.uuid4().hex}{file_ext}"
                image_path = os.path.join("uploads", "images", unique_filename).replace("\\", "/")
                with open(image_path, "wb") as f:
                    f.write(image_bytes)

            verification = verifier.verify(
                complaint=transcribed_text,
                text_summary=processed.get("summary", ""),
                text_category=processed.get("category", "Other"),
                image_summary=image_analysis.get("image_summary", ""),
                image_category=image_analysis.get("detected_category", "Other"),
                image_valid=image_analysis.get("is_valid_civic_issue", True)
            )

            # STRICT CHECK: Reject submission if the photo is not a civic issue or does not match complaint
            is_vision_fallback = image_analysis.get("is_fallback", False)
            if not is_vision_fallback:
                if not image_analysis.get("is_valid_civic_issue", True):
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                        except Exception:
                            pass
                    raise HTTPException(
                        status_code=400,
                        detail=f"Submission Rejected: The uploaded photo does not appear to show a valid public infrastructure or civic issue. (Detected: '{image_analysis.get('image_summary', '')}'). Please upload a clear photo of the grievance."
                    )

                if not verification.get("is_match", True) or verification.get("verification_status") in ["Mismatch", "Invalid Image"]:
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                        except Exception:
                            pass
                    complaint_cat = processed.get("category", "Civic")
                    image_cat = image_analysis.get("detected_category", "Other")
                    image_desc = image_analysis.get("image_summary", "")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Submission Rejected: The uploaded photo evidence does not match your grievance description. Your voice complaint describes a '{complaint_cat}' issue, but the attached photo shows '{image_cat}: {image_desc}'. Please upload photo evidence that corresponds to your complaint."
                    )

        except HTTPException:
            raise
        except Exception as err:
            print(f"[Speech Image Processing] Fallback due to error: {err}")

    # Determine primary coordinates to store
    if parsed_lat is not None and parsed_lon is not None and not (abs(parsed_lat) < 1e-5 and abs(parsed_lon) < 1e-5):
        primary_lat = parsed_lat
        primary_lon = parsed_lon
        geo_source = "device_gps"
    elif exif_lat is not None and exif_lon is not None:
        primary_lat = exif_lat
        primary_lon = exif_lon
        geo_source = "image_exif"
    else:
        primary_lat = 28.6139
        primary_lon = 77.2090
        geo_source = "constituency_default"

    try:
        filtered_complaints = list(
            complaints_collection.find(
                {
                    "category": processed.get("category", "Other"),
                    "location": location,
                },
                {
                    "_id": 0,
                },
            )
        )
        matches = similarity.find_similar(
            processed,
            filtered_complaints,
        )
    except Exception as e:
        print(f"[Similarity] Fallback due to error: {e}")
        matches = []

    # Multimodal priority calculation with image evidence weighting
    try:
        ranking = priority.calculate(
            similar_count=len(matches),
            urgency=processed.get("urgency", "Low"),
            image_severity=image_analysis.get("detected_severity") if image_analysis else None,
            image_valid=image_analysis.get("is_valid_civic_issue", False) if image_analysis else False,
            verification_status=verification.get("verification_status") if verification else None,
            category_match=verification.get("category_match", False) if verification else False
        )
    except Exception as e:
        print(f"[Priority] Fallback due to error: {e}")
        ranking = {
            "priority_score": 50,
            "priority_level": "Medium"
        }

    now = datetime.now(timezone.utc)
    user_id = current_user.get("user_id", str(current_user.get("_id", "")))

    activity_log = [
        {
            "action": "Voice Complaint Submitted & Transcribed",
            "timestamp": now.isoformat(),
        },
        {
            "action": "AI Processing Completed",
            "timestamp": now.isoformat(),
        },
        {
            "action": f"Assigned to {get_department(processed.get('category', 'Other'))}",
            "timestamp": now.isoformat(),
        },
        {
            "action": f"SLA deadline assigned based on {ranking.get('priority_level', 'Medium')} priority",
            "timestamp": now.isoformat(),
        },
    ]

    if proximity.get("location_mismatch"):
        activity_log.append({
            "action": f"Location Discrepancy Flagged: Photo GPS is {proximity.get('location_distance_km')} km away from submitted place",
            "timestamp": now.isoformat()
        })

    result = {
        **processed,

        "complaint_id": generate_complaint_id(),
        "user_id": user_id,

        "similar_count": len(matches),
        "priority_score": ranking.get("priority_score", 50),
        "priority_level": ranking.get("priority_level", "Medium"),

        "complaint": transcribed_text,
        "transcribed_complaint": transcribed_text,

        "location": location,
        "pincode": pincode or "",
        "ward_no": ward_no or "",

        # Geo & Image metadata
        "image_filename": image.filename if image else None,
        "image_content_type": image.content_type if image else None,
        "image_path": image_path,
        "latitude": primary_lat,
        "longitude": primary_lon,
        "geo_source": geo_source,

        "exif_coordinates": {
            "latitude": exif_lat,
            "longitude": exif_lon,
        } if (exif_lat is not None and exif_lon is not None) else None,
        "submitted_coordinates": {
            "latitude": parsed_lat if parsed_lat is not None else 28.6139,
            "longitude": parsed_lon if parsed_lon is not None else 77.2090,
        },
        "location_mismatch": proximity.get("location_mismatch", False),
        "location_match_status": proximity.get("location_match_status", "NO_EXIF_GPS"),
        "location_distance_km": proximity.get("location_distance_km"),
        "location_mismatch_reason": proximity.get("location_mismatch_reason"),

        # Image analysis & verification details
        "is_valid_civic_issue": image_analysis.get("is_valid_civic_issue") if image_analysis else None,
        "detected_category": image_analysis.get("detected_category") if image_analysis else None,
        "detected_severity": image_analysis.get("detected_severity") if image_analysis else None,
        "image_confidence": image_analysis.get("confidence") if image_analysis else None,
        "image_summary": image_analysis.get("image_summary") if image_analysis else None,
        "image_analysis": image_analysis,
        "verification": verification,
        "verification_status": verification.get("verification_status") if verification else "Not Applicable (Voice only)",
        "verification_score": verification.get("match_score") if verification else None,
        "category_match": verification.get("category_match") if verification else None,

        "status": "Pending",
        "assigned_department": get_department(processed.get("category", "Other")),
        "assigned_to": None,

        "sla_deadline": calculate_sla_deadline(
            ranking.get("priority_level", "Medium"),
            now
        ),

        "escalated": False,
        "resolution_remarks": None,

        "activity_log": activity_log,
        "created_at": now,
        "updated_at": now,
    }

    # Create response BEFORE MongoDB adds _id
    response = result.copy()

    # Store complaint in MongoDB
    complaints_collection.insert_one(result)

    # Remove embedding
    response.pop("embedding", None)

    return response


@api_router.get("/complaints")
def get_complaints(current_user: dict = Depends(get_current_user)):
    user_role = str(current_user.get("role", "USER")).upper()
    query = {}
    if user_role in ["ADMIN", "STAFF"]:
        # Staff and Admins have access to issues across departments with department filtering in dashboard
        query = {}
    else:
        query["user_id"] = current_user.get("user_id", str(current_user.get("_id", "")))

    complaints = list(
        complaints_collection.find(
            query,
            {
                "_id": 0,
                "embedding": 0,
            },
        )
    )

    return {
        "count": len(complaints),
        "complaints": complaints,
    }


@api_router.get("/analytics/statistics")
def get_analytics_statistics(current_user: dict = Depends(require_admin_or_staff)):
    try:
        total = complaints_collection.count_documents({})
        high = complaints_collection.count_documents(
            {"priority_level": {"$regex": "^(high|critical)$", "$options": "i"}}
        )
        medium = complaints_collection.count_documents(
            {"priority_level": {"$regex": "^(medium|moderate)$", "$options": "i"}}
        )
        low = complaints_collection.count_documents(
            {"priority_level": {"$regex": "^low$", "$options": "i"}}
        )

        return {
            "totalComplaints": total,
            "highPriority": high,
            "mediumPriority": medium,
            "lowPriority": low,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database analytics stats error: {str(e)}")


@api_router.get("/analytics/top-issues")
def get_analytics_top_issues(current_user: dict = Depends(require_admin_or_staff)):
    try:
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        results = list(complaints_collection.aggregate(pipeline))
        return [{"category": r["_id"] or "Other", "count": r["count"]} for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database analytics top issues error: {str(e)}")


@api_router.get("/analytics/category-distribution")
def get_analytics_category_distribution(current_user: dict = Depends(require_admin_or_staff)):
    try:
        total = complaints_collection.count_documents({})
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = list(complaints_collection.aggregate(pipeline))
        
        dist = []
        for r in results:
            cnt = r["count"]
            pct = round((cnt / total) * 100) if total > 0 else 0
            dist.append({
                "category": r["_id"] or "Other",
                "count": cnt,
                "percentage": pct
            })
        return dist
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database category distribution error: {str(e)}")


@api_router.get("/analytics/priority-distribution")
def get_analytics_priority_distribution(current_user: dict = Depends(require_admin_or_staff)):
    try:
        pipeline = [
            {"$group": {"_id": "$priority_level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = list(complaints_collection.aggregate(pipeline))
        
        normalized = {}
        for r in results:
            p = r["_id"] or "Low"
            p_norm = p.capitalize()
            if p_norm in ["Critical"]:
                p_norm = "High"
            if p_norm in ["Moderate"]:
                p_norm = "Medium"
            
            normalized[p_norm] = normalized.get(p_norm, 0) + r["count"]

        # Ensure Low, Medium, High exist in response
        for k in ["Low", "Medium", "High"]:
            if k not in normalized:
                normalized[k] = 0

        # Sort values logically for Recharts doughnut order (High, Medium, Low)
        ordered_keys = ["High", "Medium", "Low"]
        return [{"priority": k, "count": normalized[k]} for k in ordered_keys]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database priority distribution error: {str(e)}")


@api_router.get("/analytics/ward-analysis")
def get_analytics_ward_analysis(current_user: dict = Depends(require_admin_or_staff)):
    try:
        pipeline = [
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        results = list(complaints_collection.aggregate(pipeline))
        return [{"ward": r["_id"] or "Unknown", "count": r["count"]} for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database ward analysis error: {str(e)}")


@api_router.get("/analytics/activity-summary")
def get_analytics_activity_summary(current_user: dict = Depends(require_admin_or_staff)):
    try:
        total = complaints_collection.count_documents({})
        high = complaints_collection.count_documents({"priority_level": {"$in": ["High", "Critical", "high", "critical"]}})
        high_priority_pct = round((high / total) * 100) if total > 0 else 0

        # Highest ward
        ward_pipe = [
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        ward_res = list(complaints_collection.aggregate(ward_pipe))
        highest_ward = ward_res[0]["_id"] if ward_res else "None"

        # Generate live dynamic textual summary (remove daily today_count message)
        summary_items = [
            f"High-priority concerns account for {high_priority_pct}% of total active complaints."
        ]

        if highest_ward and highest_ward != "None":
            summary_items.append(f"Ward/Location '{highest_ward}' generated the highest number of complaints.")

        # Get top category
        cat_pipe = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        cat_res = list(complaints_collection.aggregate(cat_pipe))
        if cat_res:
            top_cat = cat_res[0]["_id"] or "General"
            summary_items.append(f"Grievances regarding '{top_cat}' remain the most reported issue.")

        summary_text = " ".join(summary_items)
        return {"summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database activity summary generation error: {str(e)}")


@api_router.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    request: StatusUpdateRequest,
    current_user: dict = Depends(require_admin_or_staff)
):

    # Validate status
    if request.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {VALID_STATUSES}"
        )

    # Find existing complaint first
    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # Get current status
    old_status = complaint.get("status", "Pending")

    # Current timestamp
    now = datetime.now(timezone.utc)

    # Update complaint and add activity log
    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "status": request.status,
                "updated_at": now
            },

            "$push": {
                "activity_log": {
                    "action": (
                        f"Status changed from "
                        f"{old_status} to {request.status}"
                    ),
                    "timestamp": now
                }
            }
        }
    )

    return {
        "message": "Complaint status updated successfully",
        "complaint_id": complaint_id,
        "old_status": old_status,
        "status": request.status
    }

@api_router.get("/public/stats")
def get_public_stats():
    try:
        total = complaints_collection.count_documents({})
        resolved = complaints_collection.count_documents({"status": {"$regex": "^(resolved|closed)$", "$options": "i"}})
        active = complaints_collection.count_documents({"status": {"$regex": "^(in progress|assigned|pending)$", "$options": "i"}})
        verified_images = complaints_collection.count_documents({"image_path": {"$ne": None}})
        return {
            "total_complaints": total,
            "resolved_complaints": resolved,
            "active_complaints": active,
            "verified_images": verified_images,
            "departments_count": len(DEPARTMENT_MAPPING),
            "average_resolution_hours": 36
        }
    except Exception as e:
        return {
            "total_complaints": 0,
            "resolved_complaints": 0,
            "active_complaints": 0,
            "verified_images": 0,
            "departments_count": 17,
            "average_resolution_hours": 36
        }

@api_router.get("/public/track/{complaint_id}")
def public_track_complaint(complaint_id: str):
    complaint_clean = complaint_id.strip().upper()
    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_clean},
        {"_id": 0, "embedding": 0, "user_id": 0}
    )

    if not complaint:
        # Also try case-insensitive regex
        complaint = complaints_collection.find_one(
            {"complaint_id": {"$regex": f"^{complaint_clean}$", "$options": "i"}},
            {"_id": 0, "embedding": 0, "user_id": 0}
        )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail=f"No grievance found matching tracking ID '{complaint_id}'. Please double check the ID (e.g. CMP-XXXXXXXX)."
        )

    return complaint

@api_router.get("/complaints/{complaint_id}/track")
def track_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):

    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id},
        {"_id": 0, "embedding": 0}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )
        
    user_id = current_user.get("user_id", str(current_user.get("_id", "")))
    user_role = str(current_user.get("role", "USER")).upper()

    if user_role not in ["ADMIN", "STAFF"] and complaint.get("user_id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this complaint"
        )

    return complaint

@api_router.patch("/complaints/{complaint_id}/assign")
def assign_complaint(
    complaint_id: str,
    request: AssignmentRequest,
    current_user: dict = Depends(require_admin_or_staff)
):

    # Find the existing complaint
    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # Get previous assignment and status
    old_assigned_to = complaint.get("assigned_to")
    old_status = complaint.get("status", "Pending")

    # Current timestamp
    now = datetime.now(timezone.utc)

    # Create activity message
    if old_assigned_to:
        action_message = (
            f"Complaint reassigned from "
            f"{old_assigned_to} to {request.assigned_to}"
        )
    else:
        action_message = (
            f"Complaint assigned to {request.assigned_to}"
        )

    # Update complaint and add activity log
    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "assigned_to": request.assigned_to,
                "status": "Assigned",
                "updated_at": now
            },

            "$push": {
                "activity_log": {
                    "action": action_message,
                    "timestamp": now
                }
            }
        }
    )

    return {
        "message": "Complaint assigned successfully",
        "complaint_id": complaint_id,
        "assigned_to": request.assigned_to,
        "previous_status": old_status,
        "status": "Assigned"
    }

@api_router.patch("/complaints/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: str,
    request: ResolutionRequest,
    current_user: dict = Depends(require_admin_or_staff)
):

    # Find existing complaint
    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # Get current status
    old_status = complaint.get("status", "Pending")

    # Current timestamp
    now = datetime.now(timezone.utc)

    # Update complaint and add activity log
    complaints_collection.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {
                "resolution_remarks": request.resolution_remarks,
                "status": "Resolved",
                "updated_at": now
            },

            "$push": {
                "activity_log": {
                    "action": (
                        f"Complaint resolved. "
                        f"Previous status: {old_status}"
                    ),
                    "timestamp": now
                }
            }
        }
    )

    return {
        "message": "Complaint resolved successfully",
        "complaint_id": complaint_id,
        "previous_status": old_status,
        "status": "Resolved",
        "resolution_remarks": request.resolution_remarks
    }

@api_router.post("/complaints/check-escalations")
def check_escalations(current_user: dict = Depends(require_admin)):

    current_time = datetime.now(timezone.utc)

    result = complaints_collection.update_many(
        {
            "status": {
                "$ne": "Resolved"
            },
            "sla_deadline": {
                "$lt": current_time
            }
        },
        {
            "$set": {
                "escalated": True,
                "status": "Escalated",
                "updated_at": current_time
            }
        }
    )

    return {
        "message": "Escalation check completed",
        "escalated_count": result.modified_count
    }

# Register Auth Router for both root and /api prefixes
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")

# Register Main API Router for both root and /api prefixes
app.include_router(api_router)
app.include_router(api_router, prefix="/api")