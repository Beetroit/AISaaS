from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel

from backend.app.config import settings
from backend.app.models.user import User
from backend.app.security import create_access_token


class ToolResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class AdminAPITool:
    """
    Service to interact with internal APIs based on admin commands.
    """

    def __init__(self):
        self.base_url = settings.internal_api_url

    async def call_api(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        admin_user: Optional[User] = None,
    ) -> ToolResponse:
        """
        Calls an internal API endpoint.

        Args:
            endpoint: The API endpoint to call (e.g., "/admin/users").
            method: The HTTP method (GET, POST, PUT, DELETE).
            payload: The request body for POST/PUT methods.
            headers: Additional headers for the request.
            admin_user: The admin user making the request (for authentication).

        Returns:
            ToolResponse indicating success/failure and data.
        """
        # Add authentication headers if admin_user provided
        if admin_user and not headers:
            headers = {}
        if admin_user:
            token = create_access_token(admin_user)
            headers["Authorization"] = f"Bearer {token}"

        full_url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            try:
                response: httpx.Response
                if method.upper() == "GET":
                    response = await client.get(full_url, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(
                        full_url, json=payload, headers=headers
                    )
                elif method.upper() == "PUT":
                    response = await client.put(full_url, json=payload, headers=headers)
                elif method.upper() == "DELETE":
                    response = await client.delete(full_url, headers=headers)
                else:
                    return ToolResponse(
                        success=False, message=f"Unsupported HTTP method: {method}"
                    )

                response.raise_for_status()  # Raise an exception for 4xx/5xx responses
                return ToolResponse(
                    success=True, message="API call successful", data=response.json()
                )
            except httpx.HTTPStatusError as e:
                return ToolResponse(
                    success=False,
                    message=f"HTTP error calling API: {e.response.status_code} - {e.response.text}",
                )
            except httpx.RequestError as e:
                return ToolResponse(
                    success=False, message=f"Request error calling API: {e}"
                )
            except Exception as e:
                return ToolResponse(
                    success=False, message=f"An unexpected error occurred: {e}"
                )

    def _matches_template(self, endpoint: str, template: str) -> bool:
        """
        Check if an endpoint matches a template pattern.
        For example: '/admin/users/{user_id}/balance' matches '/admin/users/usr_123/balance'
        """
        import re

        # Convert template with {param} to regex pattern
        pattern = re.escape(template)
        pattern = pattern.replace(r"\{[^}]+\}", r"[^/]+")  # Replace {param} with [^/]+
        return bool(re.match(f"^{pattern}$", endpoint))
