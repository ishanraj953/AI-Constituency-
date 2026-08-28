import re

content = open('backend/app.py', encoding='utf-8').read()

analytics_funcs = [
    "def get_analytics_statistics():",
    "def get_analytics_top_issues():",
    "def get_analytics_category_distribution():",
    "def get_analytics_priority_distribution():",
    "def get_analytics_ward_analysis():",
    "def get_analytics_activity_summary():"
]

for func in analytics_funcs:
    new_func = func.replace("():", "(current_user: dict = Depends(require_admin)):")
    content = content.replace(func, new_func)

# Management functions
replacements = {
    "def update_complaint_status(\n    complaint_id: str,\n    request: StatusUpdateRequest\n):": "def update_complaint_status(\n    complaint_id: str,\n    request: StatusUpdateRequest,\n    current_user: dict = Depends(require_admin)\n):",
    "def track_complaint(complaint_id: str):": "def track_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):",
    "def assign_complaint(\n    complaint_id: str,\n    request: AssignmentRequest\n):": "def assign_complaint(\n    complaint_id: str,\n    request: AssignmentRequest,\n    current_user: dict = Depends(require_admin)\n):",
    "def resolve_complaint(\n    complaint_id: str,\n    request: ResolutionRequest\n):": "def resolve_complaint(\n    complaint_id: str,\n    request: ResolutionRequest,\n    current_user: dict = Depends(require_admin)\n):",
    "def check_escalations():": "def check_escalations(current_user: dict = Depends(require_admin)):"
}

for old, new in replacements.items():
    if old in content:
        content = content.replace(old, new)
    else:
        print(f"Could not find {old}")

open('backend/app.py', 'w', encoding='utf-8').write(content)
