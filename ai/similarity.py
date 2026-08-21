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

        print("\nSimilarity Results")
        print("=" * 70)

        for stored in complaints:

            score = self.compare_embeddings(
                complaint["embedding"],
                stored["embedding"]
            )

            print(f"Category : {stored['category']}")
            print(f"Summary  : {stored['summary']}")
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