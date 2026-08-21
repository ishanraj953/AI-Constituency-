from ai.embeddings import EmbeddingGenerator
from ai.llm import ComplaintExtractor


class ComplaintProcessor:
    """Processes a complaint using the LLM and generates its embedding."""

    def __init__(self) -> None:
        self.extractor = ComplaintExtractor()
        self.embedding_generator = EmbeddingGenerator()

    def process(self, complaint: str) -> dict:
        analysis = self.extractor.extract(complaint)

        embedding_text = self._build_embedding_text(analysis)

        embedding = self.embedding_generator.encode(embedding_text)

        analysis["embedding"] = embedding

        return analysis

    @staticmethod
    def _build_embedding_text(analysis: dict) -> str:
        return (
            f"Category: {analysis['category']}\n"
            f"Urgency: {analysis['urgency']}\n"
            f"Summary: {analysis['summary']}"
        )