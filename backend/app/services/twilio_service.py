
from twilio.rest import Client

from backend.app.config import logger
from backend.app.models.credential import Credential  # Import Credential model
from backend.app.services.messaging_service import MessagingService
from backend.app.utils.encryption import encryption_helper  # Import encryption_helper


class TwilioService(MessagingService):
    def __init__(self):
        pass

    async def send_message(
        self, to: str, body: str, credential_model: Credential
    ) -> str | None:
        # Decrypt credentials data
        decrypted_creds_data = encryption_helper.decrypt_data(
            credential_model.credentials_data
        )

        twilio_sid = decrypted_creds_data.get("twilio_account_sid")
        twilio_auth_token = decrypted_creds_data.get("twilio_auth_token")
        from_number = (
            credential_model.phone_number
        )  # Get phone_number from the model directly

        if not all([twilio_sid, twilio_auth_token, from_number]):
            logger.error("Error: Missing Twilio credentials for sending message.")
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
            logger.exception(
                f"Error sending WhatsApp message via Twilio: {e}", exc_info=True
            )
            return None
