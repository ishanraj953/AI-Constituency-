SEVERITY_SCORES = {
    "low": 20,
    "medium": 50,
    "moderate": 50,
    "high": 75,
    "critical": 95,
}

class PriorityEngine:
    """
    Multimodal Priority Engine: Computes priority scores and levels
    by giving visual evidence (image analysis) high priority alongside
    text urgency, semantic similarity clusters, and verification status.
    """

    def calculate(
        self,
        similar_count: int = 0,
        urgency: str = "Low",
        image_severity: str = None,
        image_valid: bool = False,
        verification_status: str = None,
        category_match: bool = False
    ) -> dict:
        text_urgency_norm = str(urgency or "Low").strip().lower()
        text_score = SEVERITY_SCORES.get(text_urgency_norm, 20)

        # Evaluate visual image evidence if present and valid
        if image_severity and image_valid:
            img_sev_norm = str(image_severity).strip().lower()
            img_score = SEVERITY_SCORES.get(img_sev_norm, text_score)

            # High weight (60%) on visual proof + 40% on citizen narrative
            base_score = (img_score * 0.60) + (text_score * 0.40)

            # Visual Evidence Override: If photo clearly shows Critical/High hazard, ensure minimum floor
            if img_sev_norm == "critical":
                base_score = max(base_score, 90.0)
            elif img_sev_norm == "high":
                base_score = max(base_score, 75.0)
        else:
            base_score = float(text_score)

        # Verification Reliability Boost: image matches narrative
        verification_bonus = 0
        if verification_status == "Verified" or category_match:
            verification_bonus = 5

        # Repeated community complaints increase municipal urgency
        similarity_bonus = min(similar_count * 4, 20)

        total_score = min(int(round(base_score + verification_bonus + similarity_bonus)), 100)
        priority_level = self._get_priority_level(total_score)

        return {
            "priority_score": total_score,
            "priority_level": priority_level,
            "image_weighted": bool(image_severity and image_valid),
            "base_score": round(base_score, 1),
            "similarity_bonus": similarity_bonus,
            "verification_bonus": verification_bonus
        }

    @staticmethod
    def _get_priority_level(score: int) -> str:
        if score >= 88:
            return "Critical"
        if score >= 70:
            return "High"
        if score >= 40:
            return "Medium"
        return "Low"