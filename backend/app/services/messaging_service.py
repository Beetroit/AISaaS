from abc import ABC, abstractmethod
from typing import Any


class MessagingService(ABC):
    @abstractmethod
    async def send_message(
        self, to_number: str, message_body: str, credential_model: Any
    ) -> str | None:
        """
        Sends a message to a specified recipient.

        :param to_number: The recipient's identifier (e.g., phone number).
        :param message_body: The content of the message to send.
        :param creds: A dictionary containing the necessary credentials for the service.
                      Example for Twilio: {"sid": "...", "auth_token": "...", "from_number": "..."}
        :return: A message SID or identifier if successful, else None.
        """
        pass
