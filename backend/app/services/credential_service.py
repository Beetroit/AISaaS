import secrets
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.models.agent import Agent
from backend.app.models.credential import Credential
from backend.app.schemas.credential import CredentialRead
from backend.app.utils.encryption import encryption_helper


class CredentialService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_agent_by_user_id(self, user_id: str) -> Optional[Agent]:
        agent_stmt = select(Agent).where(Agent.user_id == user_id)
        result = await self.db.execute(agent_stmt)
        return result.scalar_one_or_none()

    async def create_credential(
        self, user_id: str, credential_type: str, data: Dict[str, Any]
    ) -> Credential:
        encrypted_data = encryption_helper.encrypt_data(data)
        credential = Credential(
            user_id=user_id,
            credential_type=credential_type,
            credentials_data=encrypted_data,
        )
        self.db.add(credential)
        await self.db.flush()

        return credential

    async def get_credential_by_type(
        self, user_id: str, credential_type: str
    ) -> Optional[Credential]:
        result = await self.db.execute(
            select(Credential)
            .filter_by(user_id=user_id, credential_type=credential_type)
            .limit(1)
        )
        return result.scalars().first()

    async def get_agent_by_twilio_phone_number(
        self, phone_number: str
    ) -> Optional[Agent]:
        """Finds an agent by their configured Twilio phone number using an indexed query."""
        stmt = (
            select(Agent)
            .join(Credential, Agent.user_id == Credential.user_id)
            .where(
                Credential.credential_type == "twilio",
                Credential.phone_number == phone_number,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_credential(
        self, user_id: str, credential_type: str
    ) -> Optional[Dict[str, Any]]:
        credential = await self.get_credential_by_type(user_id, credential_type)
        if credential and isinstance(credential.credentials_data, bytes):
            return encryption_helper.decrypt_data(credential.credentials_data)
        return None

    async def update_credential(
        self, user_id: str, credential_type: str, new_data: Dict[str, Any]
    ) -> Optional[Credential]:
        credential = await self.get_credential_by_type(user_id, credential_type)
        if credential:
            encrypted_data = encryption_helper.encrypt_data(new_data)
            credential.credentials_data = encrypted_data
            await self.db.flush()

            return credential
        return None

    async def create_or_update_credential(
        self, user_id: str, credential_type: str, data: Dict[str, Any]
    ) -> Credential:
        credential = await self.get_credential_by_type(user_id, credential_type)

        encrypted_data = encryption_helper.encrypt_data(data)

        if credential:
            credential.credentials_data = encrypted_data
        else:
            credential = Credential(
                user_id=user_id,
                credential_type=credential_type,
                credentials_data=encrypted_data,
            )
            self.db.add(credential)

        # Populate the top-level phone_number field for Twilio credentials
        if credential_type == "twilio":
            credential.phone_number = data.get("twilio_phone_number")
        else:
            # Ensure the field is null for other credential types
            credential.phone_number = None

        await self.db.flush()
        return credential

    async def delete_credential(self, user_id: str, credential_type: str) -> bool:
        credential = await self.get_credential_by_type(user_id, credential_type)
        if credential:
            await self.db.delete(credential)
            await self.db.flush()
            return True
        return False

    async def generate_and_store_lead_webhook_credential(
        self, user_id: str
    ) -> CredentialRead:
        agent = await self._get_agent_by_user_id(user_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No agent found for the current user.",
            )

        new_secret = secrets.token_urlsafe(32)
        credential = await self.create_or_update_credential(
            user_id=user_id,
            credential_type="lead_webhook_secret",
            data={"secret": new_secret, "agent_id": agent.id},
        )

        webhook_url = f"{settings.backend_base_url}/webhooks/lead/{agent.id}"

        # Decrypt, update, and re-encrypt the data
        decrypted_data = encryption_helper.decrypt_data(credential.credentials_data)
        decrypted_data["url"] = webhook_url
        credential.credentials_data = encryption_helper.encrypt_data(decrypted_data)

        await self.db.flush()

        # Return a Pydantic model with decrypted data
        return CredentialRead(
            id=credential.id,
            user_id=credential.user_id,
            credential_type=credential.credential_type,
            credentials_data=decrypted_data,
            created_at=credential.created_at,
            updated_at=credential.updated_at,
        )

    async def get_lead_webhook_credential_with_url(
        self, user_id: str
    ) -> Optional[CredentialRead]:
        credential = await self.get_credential_by_type(
            user_id=user_id, credential_type="lead_webhook_secret"
        )

        if not credential:
            return None

        # Ensure the URL is present, construct if necessary
        decrypted_data = encryption_helper.decrypt_data(credential.credentials_data)
        if "url" not in decrypted_data:
            agent = await self._get_agent_by_user_id(user_id)
            if agent:
                decrypted_data["url"] = (
                    f"{settings.backend_base_url}/webhooks/lead/{agent.id}"
                )
                credential.credentials_data = encryption_helper.encrypt_data(
                    decrypted_data
                )
                await self.db.flush()

        # Return a Pydantic model with decrypted data
        return CredentialRead(
            id=credential.id,
            user_id=credential.user_id,
            credential_type=credential.credential_type,
            credentials_data=decrypted_data,
            created_at=credential.created_at,
            updated_at=credential.updated_at,
        )

    async def delete_lead_webhook_credential(self, user_id: str) -> bool:
        return await self.delete_credential(user_id, "lead_webhook_secret")

    async def save_google_tokens(
        self, user_id: str, tokens: Dict[str, Any]
    ) -> Credential:
        return await self.create_credential(user_id, "google_calendar_oauth", tokens)

    async def get_google_credentials(self, user_id: str) -> Optional[Credentials]:
        tokens = await self.get_credential(user_id, "google_calendar_oauth")
        if not tokens:
            return None

        creds = Credentials.from_authorized_user_info(tokens)

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                await self.update_credential(
                    user_id, "google_calendar_oauth", creds.to_json()
                )
            else:
                return None
        return creds

    async def get_google_calendar_service(self, user_id: str):
        creds = await self.get_google_credentials(user_id)
        if not creds:
            return None
        return build("calendar", "v3", credentials=creds)

    async def save_webhook_secret(
        self, user_id: str, credential_type: str, secret: str
    ) -> Credential:
        return await self.create_credential(
            user_id, credential_type, {"secret": secret}
        )

    async def get_webhook_secret(
        self, user_id: str, credential_type: str
    ) -> Optional[str]:
        data = await self.get_credential(user_id, credential_type)
        return data.get("secret") if data else None

    async def save_stripe_customer_id(
        self, user_id: str, customer_id: str
    ) -> Credential:
        return await self.create_credential(
            user_id, "stripe_customer_id", {"customer_id": customer_id}
        )

    async def get_stripe_customer_id(self, user_id: str) -> Optional[str]:
        data = await self.get_credential(user_id, "stripe_customer_id")
        return data.get("customer_id") if data else None
