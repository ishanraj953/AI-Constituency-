from ai.complaint_processor import ComplaintProcessor
from ai.complaint_store import ComplaintStore
from ai.similarity import SimilarityEngine
from ai.ranking import PriorityEngine


def print_result(result: dict) -> None:
    print("\nComplaint Analysis")
    print("=" * 70)

    print(f"Category        : {result['category']}")
    print(f"Urgency         : {result['urgency']}")
    print(f"Summary         : {result['summary']}")
    print(f"Beneficiaries   : {result['beneficiaries']}")
    print(f"Similar Issues  : {result['similar_count']}")
    print(f"Priority Score  : {result['priority_score']}")
    print(f"Priority Level  : {result['priority_level']}")

    print("=" * 70)


def main():

    processor = ComplaintProcessor()
    store = ComplaintStore()
    similarity = SimilarityEngine()
    priority = PriorityEngine()

    existing_complaints = [
        "The main road has many potholes causing accidents.",
        "The village road is badly damaged.",
        "Street near the school requires urgent repair.",
        "There is no drinking water supply.",
        "Water pipeline is broken for many days.",
        "Electricity cuts happen every evening.",
        "Primary health centre has no doctor.",
    ]

    print("\nLoading Existing Complaints...")
    print("-" * 70)

    for complaint in existing_complaints:
        processed = processor.process(complaint)
        store.add(processed)

    print(f"{store.count()} complaints loaded successfully.")

    new_complaint = """
    The road connecting our village to the highway is full of potholes.
    School buses and ambulances are unable to travel safely.
    Immediate repair is required.
    """

    print("\nProcessing New Complaint...")
    print("-" * 70)

    processed = processor.process(new_complaint)

    matches = similarity.find_similar(
        processed,
        store.get_all()
    )

    ranking = priority.calculate(
        similar_count=len(matches),
        urgency=processed["urgency"]
    )

    processed["similar_count"] = len(matches)
    processed["priority_score"] = ranking["priority_score"]
    processed["priority_level"] = ranking["priority_level"]

    print_result(processed)

    if matches:
        print("\nMatching Complaints")
        print("=" * 70)

        for index, match in enumerate(matches, start=1):
            print(f"\nMatch {index}")
            print(f"Similarity : {match['score']}")
            print(f"Category   : {match['complaint']['category']}")
            print(f"Summary    : {match['complaint']['summary']}")


if __name__ == "__main__":
    main()