from typing import Any, Dict, Optional
from googleapiclient.discovery import Resource


class GoogleCalendarService:
    def __init__(self, calendar_service: Resource):
        self.calendar_service = calendar_service

    async def create_event(
        self, calendar_id: str, event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        event = (
            self.calendar_service.events()
            .insert(calendarId=calendar_id, body=event_data)
            .execute()
        )
        return event

    async def get_event(
        self, calendar_id: str, event_id: str
    ) -> Optional[Dict[str, Any]]:
        try:
            event = (
                self.calendar_service.events()
                .get(calendarId=calendar_id, eventId=event_id)
                .execute()
            )
            return event
        except Exception:
            return None

    async def update_event(
        self, calendar_id: str, event_id: str, event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        event = (
            self.calendar_service.events()
            .update(calendarId=calendar_id, eventId=event_id, body=event_data)
            .execute()
        )
        return event

    async def delete_event(self, calendar_id: str, event_id: str) -> bool:
        try:
            self.calendar_service.events().delete(
                calendarId=calendar_id, eventId=event_id
            ).execute()
            return True
        except Exception:
            return False

    async def list_events(
        self,
        calendar_id: str,
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 10,
    ) -> Dict[str, Any]:
        events_result = (
            self.calendar_service.events()
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
