content = open('backend/app.py', encoding='utf-8').read()
old = """@app.get("/complaints")
def get_complaints():

    complaints = list(
        complaints_collection.find(
            {},
            {
                "_id": 0,
                "embedding": 0,
            },
        )
    )

    return {
        "count": len(complaints),
        "complaints": complaints,
    }"""
new = """@app.get("/complaints")
def get_complaints(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] != "ADMIN":
        query["user_id"] = current_user["user_id"]

    complaints = list(
        complaints_collection.find(
            query,
            {
                "_id": 0,
                "embedding": 0,
            },
        )
    )

    return {
        "count": len(complaints),
        "complaints": complaints,
    }"""
content = content.replace(old, new)
open('backend/app.py', 'w', encoding='utf-8').write(content)
