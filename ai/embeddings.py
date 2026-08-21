from sentence_transformers import SentenceTransformer

from ai.config import EMBEDDING_MODEL

MODEL = SentenceTransformer(EMBEDDING_MODEL)


class EmbeddingGenerator:
    """Generates semantic embeddings."""

    def encode(self, text: str) -> list[float]:
        embedding = MODEL.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embedding.tolist()