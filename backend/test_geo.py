from backend.geo.geo_extractor import extract_geo_location
import sys
import os

if __name__ == "__main__":
    image_path = "test.jpg"

    if not os.path.exists(image_path):
        print(f"Skipping test: {image_path} not found.")
        sys.exit(0)

    with open(image_path, "rb") as image_file:
        image_bytes = image_file.read()

    location = extract_geo_location(image_bytes)

    print("\nGeo Location Result")
    print("=" * 40)

    if location:
        print(f"Latitude  : {location['latitude']}")
        print(f"Longitude : {location['longitude']}")
    else:
        print("No GPS metadata found.")

    print("=" * 40)