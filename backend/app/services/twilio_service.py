from twilio.rest import Client
from backend.app.config import settings


class TwilioService:
    def __init__(self):
        self.client = Client(settings.twilio_sid, settings.twilio_auth_token)
        self.twilio_phone_number = settings.twilio_phone_number

    async def send_whatsapp_message(self, to_number: str, message_body: str):
        try:
            message = self.client.messages.create(
                from_=f"whatsapp:{self.twilio_phone_number}",
                body=message_body,
                to=f"whatsapp:{to_number}",
            )
            return message.sid
        except Exception as e:
            # Log the error for debugging
            print(f"Error sending WhatsApp message: {e}")
            return None
