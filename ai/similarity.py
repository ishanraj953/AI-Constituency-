from sklearn.metrics.pairwise import cosine_similarity

from ai.config import SIMILARITY_THRESHOLD


class SimilarityEngine:
    """Finds similar complaints using embedding vectors."""

    def compare_embeddings(self, embedding1, embedding2) -> float:
        score = cosine_similarity(
            [embedding1],
            [embedding2]
        )[0][0]

        return float(score)

    def find_similar(self, complaint: dict, complaints: list[dict]) -> list[dict]:
        similar = []

        target_embedding = complaint.get("embedding")
        if not target_embedding or not isinstance(target_embedding, (list, tuple)):
            return []

        print("\nSimilarity Results")
        print("=" * 70)

        for stored in complaints:
            if not isinstance(stored, dict):
                continue

            stored_embedding = stored.get("embedding")
            if not stored_embedding or not isinstance(stored_embedding, (list, tuple)):
                continue

            try:
                score = self.compare_embeddings(
                    target_embedding,
                    stored_embedding
                )
            except Exception as e:
                print(f"[Similarity] Error comparing embeddings: {e}")
                continue

            category = stored.get("category", "Other")
            summary = stored.get("summary", "")
            print(f"Category : {category}")
            print(f"Summary  : {summary}")
            print(f"Score    : {score:.3f}")
            print("-" * 70)

            if score >= SIMILARITY_THRESHOLD:
                similar.append(
                    {
                        "score": round(score, 3),
                        "complaint": stored,
                    }
                )

        similar.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return similar