content = open('backend/app.py', encoding='utf-8').read()
content = content.replace('"complaint_id": generate_complaint_id(),', '"complaint_id": generate_complaint_id(),\n    "user_id": current_user["user_id"],', 1)
open('backend/app.py', 'w', encoding='utf-8').write(content)
