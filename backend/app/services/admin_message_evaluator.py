import re
from typing import Optional

from backend.app.models.user import User


class AdminMessageEvaluator:
    """
    Service to evaluate if an incoming message is an admin command.
    """

    def __init__(self):
        # Could load admin command patterns from a config or database
        self.admin_command_prefix = "/admin"

    async def evaluate_message(
        self, from_number: str, message_body: str, user: Optional[User]
    ) -> bool:
        """
        Evaluates if a message is an admin command.

        Args:
            from_number: The phone number the message originated from.
            message_body: The content of the message.
            user: The User object associated with the credential, if found.

        Returns:
            True if the message is an admin command, False otherwise.
        """
        if not user or not user.is_super_admin:
            return False

        # Check if the sender's number is whitelisted
        if user.whitelisted_phone_numbers:
            # Clean from_number to match format in whitelisted_phone_numbers (e.g., remove 'whatsapp:')
            cleaned_from_number = re.sub(
                r"^(whatsapp|sms|messenger|instagram):", "", from_number
            )
            if cleaned_from_number not in user.whitelisted_phone_numbers:
                return False
        else:
            return (
                False  # If no numbers are whitelisted, no one can send admin commands
            )

        # Check if the message starts with the admin command prefix
        if message_body.lower().startswith(self.admin_command_prefix):
            return True

        return False
