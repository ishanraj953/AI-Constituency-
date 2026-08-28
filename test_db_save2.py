from fastapi.testclient import TestClient
from backend.app import app
import sys

client = TestClient(app)

image_path = "uploads/images/472c32337c154e6a9431bbed3f51a18f.jpg"
with open(image_path, "rb") as img_file:
    try:
        response = client.post(
            "/complaints",
            data={
                "complaint": "There is a huge pothole on the main road near the station.",
                "location": "Main Road, Station Area",
                "pincode": "400001",
                "ward_no": "Ward A"
            },
            files={"image": ("test_pothole.jpg", img_file, "image/jpeg")}
        )
        print(f"Status Code: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Exception caught: {type(e).__name__} - {e}")
