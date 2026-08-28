from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import tempfile
import shutil
import os
import uuid
from backend.verification.complaint_verifier import ComplaintVerifier
from backend.geo.geo_extractor import extract_geo_location
from backend.image_analysis.image_analyzer import ImageAnalyzer
from datetime import datetime, timezone, timedelta

from backend.speech.speech_to_text import transcribe_audio

from ai.complaint_processor import ComplaintProcessor
from ai.similarity import SimilarityEngine
from ai.ranking import PriorityEngine

from backend.database.mongodb import complaints_collection


app = FastAPI(
    title="AI Constituency Backend",
    version="1.0.0",
)


processor = ComplaintProcessor()
similarity = SimilarityEngine()
priority = PriorityEngine()
image_analyzer = ImageAnalyzer()
verifier = ComplaintVerifier()

def generate_complaint_id():
    return f"CMP-{uuid.uuid4().hex[:8].upper()}"

DEPARTMENT_MAPPING = {
    "Roads": "Roads & Infrastructure Department",
    "Water Supply": "Water Supply Department",
    "Electricity": "Electrical Department",
    "Healthcare": "Health Department",
    "Education": "Education Department",
    "Sanitation": "Sanitation Department",
    "Public Transport": "Transport Department",
    "Environment": "Environment Department",
    "Housing": "Housing Department",
    "Other": "General Administration"
}

def get_department(category):
    return DEPARTMENT_MAPPING.get(
        category,
        "General Administration"
    )

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


@app.get("/")
def home():
    return {
        "message": "AI Constituency Backend Running"
    }


@app.post("/complaints")
async def submit_complaint(
    complaint: str = Form(...),
    location: str = Form(...),
    pincode: str = Form(...),
    ward_no: str = Form(...),
    image: UploadFile = File(...),
):

    # Read uploaded image
    image_bytes = await image.read()

    # Extract GPS coordinates from image EXIF
    geo_location = extract_geo_location(image_bytes)

    image_analysis = image_analyzer.analyze(
    image_bytes=image_bytes,
    content_type=image.content_type
    )

    # Reject images without geo-tag information
    if not geo_location:
        raise HTTPException(
            status_code=400,
            detail=(
                "Image does not contain GPS location data. "
                "Please upload a geo-tagged image."
            ),
        )

    # Save the image locally
    os.makedirs("uploads/images", exist_ok=True)
    file_ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    image_path = os.path.join("uploads", "images", unique_filename)
    
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    processed = processor.process(complaint)

    verification = verifier.verify(
    complaint=complaint,
    text_summary=processed["summary"],
    text_category=processed["category"],
    image_summary=image_analysis["image_summary"],
    image_category=image_analysis["detected_category"],
    image_valid=image_analysis["is_valid_civic_issue"]
    )

    processed["location"] = location

    filtered_complaints = list(
        complaints_collection.find(
            {
                "category": processed["category"],
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

    ranking = priority.calculate(
        similar_count=len(matches),
        urgency=processed["urgency"],
    )

    now = datetime.now(timezone.utc)

    result = {

    **processed,

    "complaint_id": generate_complaint_id(),

    "similar_count": len(matches),

    "priority_score": ranking["priority_score"],

    "priority_level": ranking["priority_level"],

    "complaint": complaint,

    "transcribed_complaint": None,

    # Location information
    "location": location,

    "pincode": pincode,

    "ward_no": ward_no,

    # Geo-tagged image information
    "image_filename": image.filename,
    "image_content_type": image.content_type,
    "image_path": image_path,
    "latitude": geo_location["latitude"],
    "longitude": geo_location["longitude"],

    # AI image analysis
    "is_valid_civic_issue": image_analysis["is_valid_civic_issue"],
    "detected_category": image_analysis["detected_category"],
    "detected_severity": image_analysis["detected_severity"],
    "image_confidence": image_analysis["confidence"],
    "image_summary": image_analysis["image_summary"],
    "image_analysis": image_analysis,

    # AI cross-verification

    "verification": verification,

    "verification_status":
        verification["verification_status"],

    "verification_score":
        verification["match_score"],

    "category_match":
        verification["category_match"],
    # Complaint management
    "status": "Pending",

    "assigned_department": get_department(
        processed["category"]
    ),

    "assigned_to": None,

    "sla_deadline": calculate_sla_deadline(
        ranking["priority_level"],
        now
    ),

    "escalated": False,

    "resolution_remarks": None,

    # Activity history
    "activity_log": [

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
            "action": (
                f"Assigned to "
                f"{get_department(processed['category'])}"
            ),
            "timestamp": now.isoformat(),
        },

        {
            "action": (
                f"SLA deadline assigned based on "
                f"{ranking['priority_level']} priority"
            ),
            "timestamp": now.isoformat(),
        },

    ],

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

    print("\nComplaint Verification")
    print("=" * 50)
    print(f"Verification Status : {verification['verification_status']}")
    print(f"Match Score         : {verification['match_score']}")
    print(f"Category Match      : {verification.get('category_match', False)}")
    print(f"Reason              : {verification['reason']}")
    print("=" * 50)

    print("=" * 50)

    # Remove embedding from API response
    response.pop("embedding", None)

    return response


@app.post("/speech-complaint")
def submit_speech_complaint(
    audio: UploadFile = File(...),
    location: str = Form(...),
    pincode: str = Form(None),
    ward_no: str = Form(None),
):
    # 1. Location Validation
    if not location or not location.strip():
        raise HTTPException(status_code=400, detail="Location is required and cannot be empty.")

    # 2. Extension / Format Validation
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


    # Process the transcribed text using the existing pipeline
    processed = processor.process(transcribed_text)
    processed["location"] = location

    filtered_complaints = list(
        complaints_collection.find(
            {
                "category": processed["category"],
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

    ranking = priority.calculate(
        similar_count=len(matches),
        urgency=processed["urgency"],
    )

    now = datetime.now(timezone.utc)

    result = {
        **processed,

        "complaint_id": generate_complaint_id(),

        "similar_count": len(matches),
        "priority_score": ranking["priority_score"],
        "priority_level": ranking["priority_level"],

        "complaint": transcribed_text,
        "transcribed_complaint": transcribed_text,

        "location": location,
        "pincode": pincode,
        "ward_no": ward_no,

        "status": "Pending",
        "assigned_department": get_department(processed["category"]),
        "assigned_to": None,

        "sla_deadline": calculate_sla_deadline(
            ranking["priority_level"],
            now
        ),

        "escalated": False,
        "resolution_remarks": None,

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


@app.get("/complaints")
def get_complaints():

    complaints = list(
        complaints_collection.find(
            {},
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


@app.get("/analytics/statistics")
def get_analytics_statistics():
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


@app.get("/analytics/top-issues")
def get_analytics_top_issues():
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


@app.get("/analytics/category-distribution")
def get_analytics_category_distribution():
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


@app.get("/analytics/priority-distribution")
def get_analytics_priority_distribution():
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


@app.get("/analytics/ward-analysis")
def get_analytics_ward_analysis():
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


@app.get("/analytics/activity-summary")
def get_analytics_activity_summary():
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


@app.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    request: StatusUpdateRequest
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

@app.get("/complaints/{complaint_id}/track")
def track_complaint(complaint_id: str):

    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id},
        {"_id": 0, "embedding": 0}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    return complaint

@app.patch("/complaints/{complaint_id}/assign")
def assign_complaint(
    complaint_id: str,
    request: AssignmentRequest
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

@app.patch("/complaints/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: str,
    request: ResolutionRequest
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
# we have to automate it also

@app.post("/complaints/check-escalations")
def check_escalations():

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