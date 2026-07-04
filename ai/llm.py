import json
import os

from dotenv import load_dotenv
from groq import Groq
from ai.config import GROQ_MODEL

from ai.prompts import SYSTEM_PROMPT

load_dotenv()


class ComplaintExtractor:
    """Handles complaint analysis using a Groq LLM."""

    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")

        self.client = Groq(api_key=api_key)
        self.model = GROQ_MODEL

    def extract(self, complaint: str) -> dict:
        """
        Extract structured information from a citizen complaint.

        Args:
            complaint: Raw complaint submitted by a citizen.

        Returns:
            Parsed JSON response from the LLM.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": complaint,
                },
            ],
        )

        content = response.choices[0].message.content

        return json.loads(content)