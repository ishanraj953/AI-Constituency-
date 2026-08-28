from ai.embeddings import EmbeddingGenerator


class ComplaintVerifier:

    def __init__(self) -> None:
        self.embedding_generator = EmbeddingGenerator()

    def verify(
        self,
        complaint: str,
        text_summary: str,
        text_category: str,
        image_summary: str,
        image_category: str,
        image_valid: bool
    ) -> dict:

        # --------------------------------
        # Normalize values
        # --------------------------------

        text_summary = (text_summary or "").strip()
        text_category = (text_category or "Other").strip()
        image_summary = (image_summary or "").strip()
        image_category = (image_category or "Other").strip()

        # If text summary is empty,
        # use the original complaint
        if not text_summary:
            text_summary = complaint

        # --------------------------------
        # Invalid image
        # --------------------------------

        if not image_valid:

            return {
                "is_match": False,
                "match_score": 0.0,
                "verification_status": "Invalid Image",
                "category_match": False,
                "reason": (
                    "The uploaded image does not appear to contain "
                    "a valid civic or public infrastructure issue."
                ),
                "text_category": text_category,
                "image_category": image_category
            }

        # --------------------------------
        # Combine text information
        # --------------------------------

        text_data = (
            f"Complaint: {complaint}\n"
            f"Category: {text_category}\n"
            f"Summary: {text_summary}"
        )

        # --------------------------------
        # Combine image information
        # --------------------------------

        image_data = (
            f"Category: {image_category}\n"
            f"Summary: {image_summary}"
        )

        # --------------------------------
        # Generate embeddings
        # --------------------------------

        text_embedding = self.embedding_generator.encode(
            text_data
        )

        image_embedding = self.embedding_generator.encode(
            image_data
        )

        # --------------------------------
        # Calculate semantic similarity
        # --------------------------------

        similarity_score = self._cosine_similarity(
            text_embedding,
            image_embedding
        )

        # --------------------------------
        # Category matching
        #
        # "Other" should not count as a
        # strong category match
        # --------------------------------

        category_match = (
            text_category.lower()
            ==
            image_category.lower()
            and text_category.lower() != "other"
        )

        # --------------------------------
        # Category boost
        # --------------------------------

        if category_match:

            similarity_score = min(
                similarity_score + 0.15,
                1.0
            )

        # --------------------------------
        # Determine verification status
        # --------------------------------

        if similarity_score >= 0.75:

            status = "Verified"

            reason = (
                "The complaint description and uploaded image "
                "appear to describe the same civic issue."
            )

        elif similarity_score >= 0.45:

            status = "Partially Verified"

            reason = (
                "The image appears somewhat related to the "
                "submitted complaint, but the match is not strong."
            )

        else:

            status = "Mismatch"

            reason = (
                "The uploaded image does not appear to match "
                "the submitted complaint."
            )

        # --------------------------------
        # Final response
        # --------------------------------

        return {

            "is_match": similarity_score >= 0.45,

            "match_score": round(
                float(similarity_score),
                3
            ),

            "verification_status": status,

            "reason": reason,

            "text_category": text_category,

            "image_category": image_category,

            "category_match": category_match
        }

    @staticmethod
    def _cosine_similarity(
        vector_a,
        vector_b
    ) -> float:

        dot_product = sum(
            a * b
            for a, b in zip(
                vector_a,
                vector_b
            )
        )

        magnitude_a = sum(
            a * a
            for a in vector_a
        ) ** 0.5

        magnitude_b = sum(
            b * b
            for b in vector_b
        ) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (
            magnitude_a * magnitude_b
        )