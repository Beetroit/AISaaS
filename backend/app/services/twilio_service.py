from typing import Any, Dict
from twilio.rest import Client

from backend.app.services.messaging_service import MessagingService


class TwilioService(MessagingService):
    def __init__(self):
        pass

    async def send_message(
        self, to: str, body: str, creds: Dict[str, Any]
    ) -> str | None:
        twilio_sid = creds.get("twilio_sid")
        twilio_auth_token = creds.get("twilio_auth_token")
        from_number = creds.get("twilio_phone_number")

        if not all([twilio_sid, twilio_auth_token, from_number]):
            print("Error: Missing Twilio credentials for sending message.")
            return None

        try:
            client = Client(twilio_sid, twilio_auth_token)
            message = client.messages.create(
                from_=f"whatsapp:{from_number}",
                body=body,
                to=f"whatsapp:{to}",
            )
            return message.sid
        except Exception as e:
            # Log the error for debugging
            print(f"Error sending WhatsApp message via Twilio: {e}")
            return None
