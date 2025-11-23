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
        identifier = credential_model.identifier
        channel = credential_model.channel

        if not all([twilio_sid, twilio_auth_token, identifier]):
            logger.error("Error: Missing Twilio credentials for sending message.")
            return None

        try:
            client = Client(twilio_sid, twilio_auth_token)

            if channel == "whatsapp":
                return self._send_whatsapp_message(to, body, client, identifier)
            elif channel == "facebook":
                return self._send_facebook_message(to, body, client, identifier)
            elif channel == "instagram":
                return self._send_instagram_message(to, body, client, identifier)
            else:
                logger.error(
                    f"Error: Unsupported channel '{channel}' for TwilioService."
                )
                return None

        except Exception as e:
            # Log the error for debugging
            logger.exception(
                f"Error sending message via Twilio ({channel}): {e}", exc_info=True
            )
            return None

    def _send_whatsapp_message(
        self, to: str, body: str, client: Client, from_number: str
    ) -> str:
        # Ensure 'whatsapp:' prefix is present but not duplicated
        from_addr = str(from_number).strip()
        if not from_addr.startswith("whatsapp:"):
            from_addr = f"whatsapp:{from_addr}"

        to_addr = to.strip()
        if not to_addr.startswith("whatsapp:"):
            to_addr = f"whatsapp:{to_addr}"

        message = client.messages.create(
            from_=from_addr,
            body=body,
            to=to_addr,
        )
        return message.sid

    def _send_facebook_message(
        self, to: str, body: str, client: Client, page_id: str
    ) -> str:
        # Twilio Messenger format: messenger:<Page ID>
        from_addr = str(page_id).strip()
        if not from_addr.startswith("messenger:"):
            from_addr = f"messenger:{from_addr}"

        to_addr = to.strip()
        if not to_addr.startswith("messenger:"):
            to_addr = f"messenger:{to_addr}"

        message = client.messages.create(
            from_=from_addr,
            body=body,
            to=to_addr,
        )
        return message.sid

    def _send_instagram_message(
        self, to: str, body: str, client: Client, user_id: str
    ) -> str:
        # Twilio Instagram format: instagram:<User ID> (or handle?)
        # Usually it's the sender ID (IG Professional Account SID or similar)
        # But Twilio docs say 'instagram:<sender_id>'

        from_addr = str(user_id).strip()
        if not from_addr.startswith("instagram:"):
            from_addr = f"instagram:{from_addr}"

        to_addr = to.strip()
        if not to_addr.startswith("instagram:"):
            to_addr = f"instagram:{to_addr}"

        message = client.messages.create(
            from_=from_addr,
            body=body,
            to=to_addr,
        )
        return message.sid
