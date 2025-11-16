from enum import Enum


class WorkflowRunStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class LeadQualificationStatus(str, Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONTACTED = "contacted"
    FOLLOW_UP = "follow_up"


class CredentialType(str, Enum):
    TWILIO = "twilio"
    GOOGLE_CALENDAR = "google_calendar"
    LEAD_WEBHOOK = "lead_webhook"
