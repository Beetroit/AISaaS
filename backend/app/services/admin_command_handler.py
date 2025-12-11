import logging
from typing import Any, Dict

from openai.types.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.constants.admin_commands import ADMIN_COMMANDS
from backend.app.models.user import User
from backend.app.services.admin_api_tool import AdminAPITool
from backend.app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class AdminCommandHandler:
    """
    Handles incoming admin commands using AI tool-calling to execute admin endpoints.
    """

    def __init__(
        self,
        admin_api_tool: AdminAPITool,
        ai_service: OpenAIService,
        session: AsyncSession,
    ):
        self.admin_api_tool = admin_api_tool
        self.ai_service = ai_service
        self.session = session

    async def handle_command(
        self,
        command_text: str,
        from_number: str,
        user: User,
        **kwargs,
    ) -> str:
        """
        Uses AI to interpret natural language admin commands and execute appropriate endpoints.

        Args:
            command_text: The full text of the admin command (e.g., "/admin what's my balance").
            from_number: The phone number the command originated from.
            user: The User object who sent the command.

        Returns:
            A string response to be sent back to the admin.
        """
        logger.info(f"Received admin command: {command_text}")

        # Clean the command text
        cleaned_command = command_text.replace("/admin", "").strip()
        if not cleaned_command:
            return "Admin: Please provide a command after /admin"

        try:
            # Create the admin execution tool
            admin_tool = self._create_admin_tool(user)
            logger.info(f"Created admin tool for command handling: {admin_tool}")
            # AI prompt to interpret command and select endpoint
            system_prompt = self._create_system_prompt(user)
            user_prompt = f"Admin command: {cleaned_command}"

            # Call AI with tool
            ai_response = await self.ai_service.create_gpt5_response(
                input=user_prompt,
                system_prompt=system_prompt,
                tools=[admin_tool],
                tool_choice="auto",
            )
            logger.info(f"AI response for admin command: {ai_response}")

            # Parse AI response for tool call
            tool_call = self._extract_tool_call(ai_response)
            logger.info(f"Extracted tool call from AI response: {tool_call}")
            if not tool_call or tool_call.get("name") != "execute_admin_endpoint":
                return (
                    "Admin: I couldn't understand that command. Please try rephrasing."
                )

            # Execute the endpoint
            template_url = tool_call.get("arguments", {}).get("url", "")
            if not template_url:
                return "Admin: No endpoint was selected for execution."

            # Validate template URL against allowed endpoints BEFORE substitution
            if not self._is_endpoint_allowed(
                template_url, user.allowed_admin_endpoints
            ):
                return f"Admin: Unauthorized access to endpoint: {template_url}"

            # Substitute user_id placeholder
            endpoint_url = self._substitute_placeholders(template_url, user)

            # Execute the API call
            api_response = await self.admin_api_tool.call_api(
                endpoint=endpoint_url,
                method="GET",  # All admin commands are GET for now
                admin_user=user,  # Pass admin user for authentication
            )
            logger.info(f"API response from admin endpoint call: {api_response}")
            if not api_response.success:
                return f"Admin: Request failed - {api_response.message}"

            # Send raw API response back to AI for natural language formatting
            formatting_prompt = f"""
Based on this API response, provide a natural, concise response for the admin:

API Response: {api_response.data}

Original command: {cleaned_command}

Respond as if you're confirming what the admin asked for.
"""

            final_response_text, _ = await self.ai_service.generate_response(
                prompt=formatting_prompt,
                system_prompt="You are an admin assistant. Format API responses into clear, natural language messages for WhatsApp.",
            )

            return final_response_text.strip()

        except Exception as e:
            logger.error(f"Error processing admin command: {e}")
            return "Admin: An error occurred while processing your command. Please try again."

    def _create_admin_tool(self, user: User) -> Dict[str, Any]:
        """Create the admin endpoint execution tool."""
        # Build available endpoints list
        available_endpoints = []
        for cmd in ADMIN_COMMANDS:
            # Only include endpoints the user is allowed to access
            if (
                not user.allowed_admin_endpoints
                or cmd["url"] in user.allowed_admin_endpoints
            ):
                available_endpoints.append(f"{cmd['url']} - {cmd['description']}")

        if not available_endpoints:
            available_endpoints = ["No endpoints available for your access level"]

        tool_description = f"""
Execute an admin API endpoint. Available endpoints:
{chr(10).join(available_endpoints)}

Choose the most appropriate endpoint based on the admin's natural language command.
For personal queries like "my balance", use endpoints with {{user_id}} placeholders.
"""

        return {
            "type": "function",
            "function": {
                "name": "execute_admin_endpoint",
                "description": tool_description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The template API endpoint URL (may include {user_id} placeholders that will be substituted)",
                        }
                    },
                    "required": ["url"],
                    "additionalProperties": False,
                },
                "strict": True,
            },
        }

    def _create_system_prompt(self, user: User) -> str:
        """Create system prompt for AI command interpretation."""
        return f"""You are an admin command interpreter for a WhatsApp bot system.

Your task is to interpret natural language admin commands and select the appropriate API endpoint to execute.

Available endpoints:
{chr(10).join([f"- {cmd['url']}: {cmd['description']}" for cmd in ADMIN_COMMANDS])}

The current admin user has ID: {user.id}

For personal queries (like "my balance"), return the template URL with {{user_id}} placeholder. Do NOT substitute the actual user ID - the system will handle substitution automatically.

Always respond with a tool call to execute the most appropriate endpoint. If no appropriate endpoint exists, still make a tool call but the system will handle the error gracefully.

Examples:
- "what's my balance" → execute "/admin/users/{{user_id}}/balance"
- "how many workflows are there" → execute "/admin/workflows/counts"
- "how many leads do I have" → execute "/admin/leads/counts" """

    def _extract_tool_call(self, ai_response: Response) -> Dict[str, Any] | None:
        """Extract tool call from AI response."""
        # Look for ResponseFunctionToolCall items in response.output
        for item in ai_response.output:
            if hasattr(item, "type") and item.type == "function_call":
                # Parse the arguments JSON
                import json

                try:
                    arguments = json.loads(item.arguments)
                    logger.info(f"Parsed tool call arguments: {arguments}")
                    return {
                        "name": item.name,
                        "arguments": arguments,
                    }
                except (json.JSONDecodeError, AttributeError) as e:
                    logger.error(f"Failed to parse tool call arguments: {e}")
                    continue

        return None

    def _substitute_placeholders(self, endpoint_url: str, user: User) -> str:
        """Substitute placeholders in endpoint URLs."""
        return endpoint_url.replace("{user_id}", user.id)

    def _is_endpoint_allowed(
        self, template_url: str, allowed_endpoints: list[str] | None
    ) -> bool:
        """Check if a template endpoint is allowed for the user."""
        if not allowed_endpoints:
            return True  # No restrictions

        # Check if the template URL matches any allowed template
        import re

        for allowed_template in allowed_endpoints:
            # Convert template with {param} to regex pattern
            pattern = re.escape(allowed_template)
            pattern = pattern.replace(
                r"\{[^}]+\}", r"[^/]+"
            )  # Replace {param} with [^/]+
            if re.match(f"^{pattern}$", template_url):
                return True

        return False
