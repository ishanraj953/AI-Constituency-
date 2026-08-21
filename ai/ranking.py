URGENCY_SCORES = {
    "Low": 20,
    "Medium": 45,
    "High": 70,
    "Critical": 90,
}


class PriorityEngine:

    """Calculates the priority of a complaint."""

    def calculate(
        self,
        similar_count: int,
        urgency: str
    ) -> dict:

        # Base priority comes from AI-detected urgency
        urgency_score = URGENCY_SCORES.get(
            urgency,
            20
        )

        # Repeated complaints increase priority
        similarity_bonus = min(
            similar_count * 5,
            30
        )

        # Final score cannot exceed 100
        total_score = min(
            urgency_score + similarity_bonus,
            100
        )

        return {
            "priority_score": total_score,
            "priority_level": self._get_priority_level(
                total_score
            ),
        }

    @staticmethod
    def _get_priority_level(score: int) -> str:

        if score >= 90:
            return "Critical"

        if score >= 70:
            return "High"

        if score >= 40:
            return "Medium"

        return "Low"