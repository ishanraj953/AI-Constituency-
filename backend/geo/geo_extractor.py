from io import BytesIO
from PIL import Image, ExifTags
import math


def _to_float(val) -> float:
    """
    Convert any EXIF rational representation (tuple, IFDRational, float, int, str) to float.
    """
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val) if not (math.isnan(val) or math.isinf(val)) else 0.0
    if hasattr(val, "numerator") and hasattr(val, "denominator"):
        try:
            num = float(val.numerator)
            den = float(val.denominator)
            return (num / den) if den != 0 else 0.0
        except Exception:
            pass
    if isinstance(val, (tuple, list)):
        if len(val) == 2:
            num = _to_float(val[0])
            den = _to_float(val[1])
            return (num / den) if den != 0 else 0.0
        if len(val) == 1:
            return _to_float(val[0])
    try:
        f = float(val)
        return f if not (math.isnan(f) or math.isinf(f)) else 0.0
    except Exception:
        pass
    if isinstance(val, str):
        val = val.strip()
        if "/" in val:
            parts = val.split("/")
            if len(parts) == 2:
                try:
                    num = float(parts[0].strip())
                    den = float(parts[1].strip())
                    return (num / den) if den != 0 else 0.0
                except Exception:
                    pass
        try:
            f = float(val)
            return f if not (math.isnan(f) or math.isinf(f)) else 0.0
        except Exception:
            pass
    return 0.0


def _convert_to_degrees(coord_val) -> float | None:
    """
    Convert GPS coordinate values (DMS tuple, single rational, or decimal) into decimal degrees.
    """
    if coord_val is None:
        return None
    if isinstance(coord_val, (int, float)):
        f = float(coord_val)
        return f if not (math.isnan(f) or math.isinf(f)) else None
    if isinstance(coord_val, (tuple, list)):
        if len(coord_val) == 1:
            deg = _to_float(coord_val[0])
            return deg if not (math.isnan(deg) or math.isinf(deg)) else None
        elif len(coord_val) >= 3:
            degrees = _to_float(coord_val[0])
            minutes = _to_float(coord_val[1])
            seconds = _to_float(coord_val[2])
            total = degrees + (minutes / 60.0) + (seconds / 3600.0)
            return total if not (math.isnan(total) or math.isinf(total)) else None
        elif len(coord_val) == 2:
            degrees = _to_float(coord_val[0])
            minutes = _to_float(coord_val[1])
            total = degrees + (minutes / 60.0)
            return total if not (math.isnan(total) or math.isinf(total)) else None
    res = _to_float(coord_val)
    return res if not (math.isnan(res) or math.isinf(res)) else None


def _get_tag(gps_dict: dict, int_key: int, str_key: str):
    """
    Lookup a tag value by integer key (e.g. 2), string name (e.g. 'GPSLatitude'), or case-insensitive match.
    """
    if not isinstance(gps_dict, dict):
        return None
    if int_key in gps_dict and gps_dict[int_key] is not None:
        return gps_dict[int_key]
    if str_key in gps_dict and gps_dict[str_key] is not None:
        return gps_dict[str_key]
    for k, v in gps_dict.items():
        if str(k).lower() == str_key.lower():
            return v
        try:
            if int(k) == int_key:
                return v
        except Exception:
            pass
    return None


def extract_geo_location(image_bytes: bytes) -> dict | None:
    """
    Extract latitude and longitude from image EXIF metadata using multiple fallback strategies.

    Returns:
        {
            "latitude": float,
            "longitude": float,
            "source": "image_exif"
        }

    Returns None if GPS metadata is unavailable or invalid.
    """
    if not image_bytes:
        return None

    try:
        image = Image.open(BytesIO(image_bytes))

        gps_info = {}

        # Strategy 1: modern Pillow getexif().get_ifd(ExifTags.IFD.GPSInfo or 0x8825)
        try:
            exif = image.getexif()
            if exif:
                gps_ifd_tag = getattr(getattr(ExifTags, "IFD", None), "GPSInfo", 0x8825)
                ifd = exif.get_ifd(gps_ifd_tag)
                if ifd:
                    gps_info.update(ifd)
                if not gps_info:
                    ifd2 = exif.get_ifd(0x8825)
                    if ifd2:
                        gps_info.update(ifd2)
                if not gps_info and 34853 in exif and isinstance(exif[34853], dict):
                    gps_info.update(exif[34853])
        except Exception:
            pass

        # Strategy 2: legacy Pillow _getexif() tag 34853 (0x8825)
        try:
            if hasattr(image, "_getexif") and callable(image._getexif):
                raw_exif = image._getexif()
                if raw_exif:
                    if 34853 in raw_exif and isinstance(raw_exif[34853], dict):
                        gps_info.update(raw_exif[34853])
                    elif 0x8825 in raw_exif and isinstance(raw_exif[0x8825], dict):
                        gps_info.update(raw_exif[0x8825])
                    for k, v in raw_exif.items():
                        if isinstance(v, dict) and ExifTags.TAGS.get(k) == "GPSInfo":
                            gps_info.update(v)
        except Exception:
            pass

        if not gps_info:
            return None

        # GPS Tag IDs:
        # 1: GPSLatitudeRef ('N', 'S')
        # 2: GPSLatitude (DMS or Decimal)
        # 3: GPSLongitudeRef ('E', 'W')
        # 4: GPSLongitude (DMS or Decimal)
        latitude_val = _get_tag(gps_info, 2, "GPSLatitude")
        latitude_ref = _get_tag(gps_info, 1, "GPSLatitudeRef")
        longitude_val = _get_tag(gps_info, 4, "GPSLongitude")
        longitude_ref = _get_tag(gps_info, 3, "GPSLongitudeRef")

        if latitude_val is None or longitude_val is None:
            return None

        lat_deg = _convert_to_degrees(latitude_val)
        lon_deg = _convert_to_degrees(longitude_val)

        if lat_deg is None or lon_deg is None:
            return None

        def _clean_ref(ref_val, default: str) -> str:
            if ref_val is None:
                return default
            if isinstance(ref_val, (bytes, bytearray)):
                decoded = ref_val.decode("utf-8", errors="ignore")
            else:
                decoded = str(ref_val)
            cleaned = decoded.replace("\x00", "").strip().upper()
            return cleaned if cleaned else default

        lat_ref_str = _clean_ref(latitude_ref, "N")
        lon_ref_str = _clean_ref(longitude_ref, "E")

        if lat_ref_str.startswith("S"):
            lat_deg = -abs(lat_deg)
        else:
            lat_deg = abs(lat_deg)

        if lon_ref_str.startswith("W"):
            lon_deg = -abs(lon_deg)
        else:
            lon_deg = abs(lon_deg)

        # Basic validity check (-90 to 90 for lat, -180 to 180 for lon)
        if not (-90.0 <= lat_deg <= 90.0 and -180.0 <= lon_deg <= 180.0):
            return None

        # Reject Null Island placeholder coordinates (0, 0)
        if abs(lat_deg) < 1e-5 and abs(lon_deg) < 1e-5:
            return None

        return {
            "latitude": round(float(lat_deg), 6),
            "longitude": round(float(lon_deg), 6),
            "source": "image_exif"
        }

    except Exception as error:
        print(f"Geo extraction error: {error}")
        return None


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth (in kilometers).
    """
    try:
        R = 6371.0  # Radius of the Earth in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(max(0.0, a)), math.sqrt(max(0.0, 1.0 - a)))
        return round(R * c, 2)
    except Exception:
        return 0.0


def check_location_proximity(
    exif_lat: float | None,
    exif_lon: float | None,
    submitted_lat: float | None,
    submitted_lon: float | None,
    threshold_km: float = 2.0
) -> dict:
    """
    Compare image EXIF coordinates with submitted place/device coordinates.
    Returns mismatch flag, distance, and explanation for administrative review.
    """
    if exif_lat is None or exif_lon is None:
        return {
            "has_exif": False,
            "location_mismatch": False,
            "location_match_status": "NO_EXIF_GPS",
            "location_distance_km": None,
            "location_mismatch_reason": None
        }

    if submitted_lat is None or submitted_lon is None:
        return {
            "has_exif": True,
            "location_mismatch": False,
            "location_match_status": "NO_SUBMITTED_GPS",
            "location_distance_km": None,
            "location_mismatch_reason": None
        }

    dist_km = calculate_haversine_distance(exif_lat, exif_lon, submitted_lat, submitted_lon)
    is_mismatch = dist_km > threshold_km

    if is_mismatch:
        reason = (
            f"Image EXIF GPS ({round(exif_lat, 4)}, {round(exif_lon, 4)}) is "
            f"{dist_km} km away from submitted place coordinates ({round(submitted_lat, 4)}, {round(submitted_lon, 4)}). "
            f"Possible off-site photo evidence."
        )
    else:
        reason = None

    return {
        "has_exif": True,
        "location_mismatch": is_mismatch,
        "location_match_status": "MISMATCH" if is_mismatch else "MATCHED",
        "location_distance_km": dist_km,
        "location_mismatch_reason": reason
    }