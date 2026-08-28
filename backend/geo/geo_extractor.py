from io import BytesIO

from PIL import Image
from PIL.ExifTags import Base


def convert_to_float(value) -> float:
    """
    Convert EXIF GPS rational values to float.
    """

    try:
        return float(value)

    except (TypeError, ValueError):

        return value.numerator / value.denominator


def convert_to_degrees(value) -> float:
    """
    Convert GPS coordinates from:
    degrees, minutes, seconds

    into decimal degrees.
    """

    degrees = convert_to_float(value[0])
    minutes = convert_to_float(value[1])
    seconds = convert_to_float(value[2])

    return degrees + (minutes / 60.0) + (seconds / 3600.0)


def extract_geo_location(image_bytes: bytes) -> dict | None:
    """
    Extract latitude and longitude from image EXIF metadata.

    Returns:
        {
            "latitude": float,
            "longitude": float
        }

    Returns None if GPS metadata is unavailable.
    """

    try:

        image = Image.open(BytesIO(image_bytes))

        exif_data = image.getexif()

        if not exif_data:
            return None

        gps_info = exif_data.get_ifd(Base.GPSInfo)

        if not gps_info:
            return None

        # Standard GPS EXIF tag IDs
        GPS_LATITUDE_REF = 1
        GPS_LATITUDE = 2
        GPS_LONGITUDE_REF = 3
        GPS_LONGITUDE = 4

        latitude = gps_info.get(GPS_LATITUDE)
        latitude_ref = gps_info.get(GPS_LATITUDE_REF)

        longitude = gps_info.get(GPS_LONGITUDE)
        longitude_ref = gps_info.get(GPS_LONGITUDE_REF)

        if not all(
            [
                latitude,
                latitude_ref,
                longitude,
                longitude_ref,
            ]
        ):
            return None

        latitude_decimal = convert_to_degrees(latitude)

        longitude_decimal = convert_to_degrees(longitude)

        if str(latitude_ref).upper() == "S":
            latitude_decimal = -latitude_decimal

        if str(longitude_ref).upper() == "W":
            longitude_decimal = -longitude_decimal

        return {
            "latitude": round(latitude_decimal, 6),
            "longitude": round(longitude_decimal, 6),
        }

    except Exception as error:

        print(f"Geo extraction error: {error}")

        return None