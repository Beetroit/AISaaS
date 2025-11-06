from typing import Any, Dict, Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.credential_service import CredentialService


class GoogleCalendarService:
    def __init__(self, db: AsyncSession, credential_service: CredentialService):
        self.db = db
        self.credential_service = credential_service

    async def _get_calendar_service(self, user_id: str) -> Optional[Any]:
        credentials_data = await self.credential_service.get_credential(
            user_id, "google_oauth_tokens"
        )
        if not credentials_data:
            return None

        creds = Credentials.from_authorized_user_info(credentials_data)
        # TODO: Implement token refresh logic if needed
        return build("calendar", "v3", credentials=creds)

    async def create_calendar_event(
        self, user_id: str, event_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        service = await self._get_calendar_service(user_id)
        if not service:
            raise Exception(
                "Google Calendar service not initialized. User not authenticated."
            )
        event = (
            service.events().insert(calendarId="primary", body=event_details).execute()
        )
        return event

    async def get_event(
        self, user_id: str, calendar_id: str, event_id: str
    ) -> Optional[Dict[str, Any]]:
        service = await self._get_calendar_service(user_id)
        if not service:
            return None
        try:
            event = (
                service.events().get(calendarId=calendar_id, eventId=event_id).execute()
            )
            return event
        except Exception:
            return None

    async def update_event(
        self, user_id: str, calendar_id: str, event_id: str, event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        service = await self._get_calendar_service(user_id)
        if not service:
            raise Exception(
                "Google Calendar service not initialized. User not authenticated."
            )
        event = (
            service.events()
            .update(calendarId=calendar_id, eventId=event_id, body=event_data)
            .execute()
        )
        return event

    async def delete_event(self, user_id: str, calendar_id: str, event_id: str) -> bool:
        service = await self._get_calendar_service(user_id)
        if not service:
            return False
        try:
            service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            return True
        except Exception:
            return False

    async def list_events(
        self,
        user_id: str,
        calendar_id: str,
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 10,
    ) -> Dict[str, Any]:
        service = await self._get_calendar_service(user_id)
        if not service:
            return {"events": []}
        events_result = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events = events_result.get("items", [])
        return {"events": events}
