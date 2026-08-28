from backend.database.mongodb import complaints_collection

if __name__ == "__main__":
    try:
        complaints_collection.insert_one(
            {
                "name": "MongoDB Connected Test"
            }
        )
        print("Connected Successfully")
    except Exception as e:
        print(f"Connection Failed: {e}")