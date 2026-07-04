class ComplaintStore:
    """Stores processed complaints in memory."""

    def __init__(self) -> None:
        self._complaints: list[dict] = []

    def add(self, complaint: dict) -> None:
        """Add a processed complaint."""

        self._complaints.append(complaint)

    def get_all(self) -> list[dict]:
        """Return all stored complaints."""

        return self._complaints

    def count(self) -> int:
        """Return total complaints."""

        return len(self._complaints)

    def clear(self) -> None:
        """Remove all complaints."""

        self._complaints.clear()