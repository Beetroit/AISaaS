from typing import List, TypedDict


class AdminCommandInfo(TypedDict):
    url: str
    description: str


ADMIN_COMMANDS: List[AdminCommandInfo] = [
    {
        "url": "/admin/users/{user_id}/balance",
        "description": "Get User Message Credit Balance",
    },
    {
        "url": "/admin/workflows/counts",
        "description": "Get Workflow Counts (Total/Status)",
    },
    {"url": "/admin/leads/counts", "description": "Get Lead Counts (Total/Status)"},
]
