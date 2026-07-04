from database.mongodb import complaints_collection

complaints_collection.insert_one(
    {
        "name": "MongoDB Connected"
    }
)

print("Connected Successfully")