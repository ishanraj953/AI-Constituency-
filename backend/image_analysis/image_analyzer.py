import os
import json
import logging

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
logger = logging.getLogger("ImageAnalyzer")


class ImageAnalyzer:
    """Analyzes civic complaint images with robust fallback for rate limits and errors."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables.")
            self.client = None
        else:
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.client = None

        self.candidate_models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.7-flash",
        ]

    def analyze(
        self,
        image_bytes: bytes,
        content_type: str = "image/jpeg"
    ) -> dict:
        prompt = """
You are an AI system that analyzes images submitted as
evidence for civic complaints.

Analyze the image carefully.

Determine whether the image shows a valid civic or public
infrastructure issue.

Possible categories are:

- Roads & Bridges
- Water Supply
- Drainage & Sewage
- Sanitation & Waste Management
- Electricity & Power
- Street Lighting
- Public Safety & Law/Order
- Healthcare & Hospitals
- Education & Schools
- Public Transport & Traffic
- Environment & Pollution
- Parks & Recreation
- Housing & Slum Rehabilitation
- Revenue & Land Records
- Public Distribution System (PDS)
- Social Welfare & Pensions
- Other

Severity must be one of:

- Low
- Medium
- High
- Critical

Return ONLY valid JSON in this exact format:

{
    "is_valid_civic_issue": true,
    "detected_category": "Sanitation",
    "detected_severity": "High",
    "confidence": 0.92,
    "image_summary": "Brief description of the civic issue visible in the image."
}

Rules:

1. Do not invent objects that are not visible.
2. If the image does not clearly show a civic issue,
   set is_valid_civic_issue to false.
3. Confidence must be between 0 and 1.
4. image_summary should describe only what is visually observable.
5. Choose only one category.
"""

        if self.client and image_bytes:
            for model_name in self.candidate_models:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=[
                            prompt,
                            types.Part.from_bytes(data=image_bytes, mime_type=content_type)
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.0,
                        ),
                    )

                    content = (response.text or "").strip()
                    # Strip code fences if present
                    if content.startswith("```"):
                        content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                    parsed = json.loads(content)
                    if isinstance(parsed, dict) and "is_valid_civic_issue" in parsed:
                        parsed["is_fallback"] = False
                        return parsed
                except Exception as err:
                    logger.warning(f"Image analysis error on {model_name}: {err}")
                    continue

        # Safe fallback when quota is exhausted or API is unreachable
        return {
            "is_valid_civic_issue": True,
            "detected_category": "Other",
            "detected_severity": "Medium",
            "confidence": 0.85,
            "image_summary": "Photographic evidence attached for civic grievance resolution.",
            "is_fallback": True
        }