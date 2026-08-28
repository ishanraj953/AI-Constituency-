content = open('backend/app.py', encoding='utf-8').read()

old = """@app.get("/complaints/{complaint_id}/track")
def track_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):

    complaint = complaints_collection.find_one(
        {"complaint_id": complaint_id},
        {"_id": 0, "embedding": 0}
    )

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )"""

new = """@app.get("/complaints/{complaint_id}/track")
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
        
    if current_user["role"] != "ADMIN" and complaint.get("user_id") != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this complaint"
        )"""

content = content.replace(old, new)
open('backend/app.py', 'w', encoding='utf-8').write(content)
