URGENCY_SCORES = {
    "Low": 10,
    "Medium": 20,
    "High": 30,
    "Critical": 40,
}


class PriorityEngine:
    """Calculates the priority of a complaint."""

    def calculate(self, similar_count: int, urgency: str) -> dict:
        complaint_score = min(similar_count * 5, 70)
        urgency_score = URGENCY_SCORES.get(urgency, 0)

        total_score = complaint_score + urgency_score

        return {
            "priority_score": total_score,
            "priority_level": self._get_priority_level(total_score),
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