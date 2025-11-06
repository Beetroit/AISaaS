from typing import Any, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.credential import Credential
from backend.app.utils.encryption import encryption_helper


class CredentialService:
    def __init__(self, db: AsyncSession):
        self.db = db

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
        await self.db.commit()
        await self.db.refresh(credential)
        return credential

    async def get_credential(
        self, user_id: str, credential_type: str
    ) -> Optional[Dict[str, Any]]:
        result = await self.db.execute(
            select(Credential)
            .filter_by(user_id=user_id, credential_type=credential_type)
            .limit(1)
        )
        credential = result.scalars().first()
        if credential and isinstance(credential.credentials_data, bytes):
            return encryption_helper.decrypt_data(credential.credentials_data)
        return None

    async def update_credential(
        self, user_id: str, credential_type: str, new_data: Dict[str, Any]
    ) -> Optional[Credential]:
        result = await self.db.execute(
            select(Credential)
            .filter_by(user_id=user_id, credential_type=credential_type)
            .limit(1)
        )
        credential = result.scalars().first()
        if credential:
            encrypted_data = encryption_helper.encrypt_data(new_data)
            credential.credentials_data = encrypted_data
            await self.db.commit()
            await self.db.refresh(credential)
            return credential
        return None

    async def delete_credential(self, user_id: str, credential_type: str) -> bool:
        result = await self.db.execute(
            select(Credential)
            .filter_by(user_id=user_id, credential_type=credential_type)
            .limit(1)
        )
        credential = result.scalars().first()
        if credential:
            await self.db.delete(credential)
            await self.db.commit()
            return True
        return False

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
