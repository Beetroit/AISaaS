from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Response, status

from backend.app.dependencies import CredentialServiceDep, CurrentUser
from backend.app.schemas.credential import (
    CredentialCreate,
    CredentialRead,
    TwilioCredentialCreate,
    TwilioCredentialResponse,
)

router = APIRouter(prefix="/credentials", tags=["Credentials"])


# ===== TWILIO CREDENTIAL MANAGEMENT =====


@router.post("/twilio", response_model=TwilioCredentialResponse)
async def create_or_update_twilio_credentials(
    twilio_data: TwilioCredentialCreate,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Create or update Twilio credentials for the current user."""

    # Prepare credential data
    credentials_data = {
        "twilio_account_sid": twilio_data.twilio_account_sid,
        "twilio_auth_token": twilio_data.twilio_auth_token,
        "twilio_phone_number": twilio_data.twilio_phone_number,
    }

    # Store or update the credential
    credential = await credential_service.create_or_update_credential(
        user_id=current_user.id,
        credential_type="twilio",
        data=credentials_data,
        phone_number=twilio_data.twilio_phone_number,
    )

    # Return safe response (no sensitive data)
    return TwilioCredentialResponse(
        id=credential.id,
        credential_type=credential.credential_type,
        phone_number=credential.phone_number,
        has_account_sid=True,
        has_auth_token=True,
        created_at=credential.created_at,
        updated_at=credential.updated_at,
    )


@router.get("/twilio", response_model=TwilioCredentialResponse)
async def get_twilio_credentials(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Get Twilio credentials (without sensitive data)."""

    credential = await credential_service.get_credential_by_type(
        user_id=current_user.id, credential_type="twilio"
    )

    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Twilio credentials not found for this user.",
        )

    # Check if sensitive data exists
    has_account_sid = False
    has_auth_token = False

    if credential.credentials_data:
        from backend.app.utils.encryption import encryption_helper

        decrypted_data = encryption_helper.decrypt_data(credential.credentials_data)
        has_account_sid = "twilio_account_sid" in decrypted_data
        has_auth_token = "twilio_auth_token" in decrypted_data

    return TwilioCredentialResponse(
        id=credential.id,
        credential_type=credential.credential_type,
        phone_number=credential.phone_number,
        has_account_sid=has_account_sid,
        has_auth_token=has_auth_token,
        created_at=credential.created_at,
        updated_at=credential.updated_at,
    )


@router.delete("/twilio", status_code=status.HTTP_204_NO_CONTENT)
async def delete_twilio_credentials(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Delete Twilio credentials."""

    success = await credential_service.delete_credential(
        user_id=current_user.id, credential_type="twilio"
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Twilio credentials not found for this user.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/twilio/test")
async def test_twilio_credentials(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Test if Twilio credentials are valid by making a test API call."""

    credentials_data = await credential_service.get_credential(
        user_id=current_user.id, credential_type="twilio"
    )

    if not credentials_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Twilio credentials not found.",
        )

    # Validate required fields
    required_fields = ["twilio_account_sid", "twilio_auth_token", "twilio_phone_number"]
    missing_fields = [
        field for field in required_fields if field not in credentials_data
    ]

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields: {', '.join(missing_fields)}",
        )

    try:
        # Test Twilio API connection
        from twilio.rest import Client

        client = Client(
            credentials_data["twilio_account_sid"],
            credentials_data["twilio_auth_token"],
        )

        # Try to fetch account info as a test
        account = client.api.account.fetch()

        return {
            "valid": True,
            "account_sid": str(account.sid),
            "account_status": account.status,
            "phone_number": credentials_data["twilio_phone_number"],
            "message": "Twilio credentials are valid and working.",
        }

    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "message": "Twilio credentials test failed. Please check your credentials.",
        }


# ===== GENERAL CREDENTIAL MANAGEMENT =====


@router.get("/", response_model=List[Dict[str, Any]])
async def get_user_credentials(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Get all credentials for the current user (without sensitive data)."""

    # Get all credential types for this user

    # Note: This would need a new method in CredentialService to get all user credentials
    # For now, let's list the supported credential types
    credential_types = [
        "twilio",
        "google_calendar_oauth",
        "lead_webhook_secret",
        "stripe_customer_id",
    ]

    user_credentials = []

    for cred_type in credential_types:
        credential = await credential_service.get_credential_by_type(
            user_id=current_user.id, credential_type=cred_type
        )

        if credential:
            # Create a safe response based on credential type
            safe_data = {
                "id": credential.id,
                "credential_type": credential.credential_type,
                "phone_number": credential.phone_number,
                "created_at": credential.created_at,
                "updated_at": credential.updated_at,
            }

            # Add type-specific safe data
            if cred_type == "twilio":
                safe_data["has_credentials"] = True
                safe_data["phone_number"] = credential.phone_number
            elif cred_type == "lead_webhook_secret":
                from backend.app.utils.encryption import encryption_helper

                decrypted_data = encryption_helper.decrypt_data(
                    credential.credentials_data
                )
                safe_data["has_webhook_url"] = "url" in decrypted_data
            else:
                safe_data["has_data"] = True

            user_credentials.append(safe_data)

    return user_credentials


@router.post("/", response_model=CredentialRead)
async def create_credential(
    credential_data: CredentialCreate,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    """Create a new credential."""

    # Ensure user can only create credentials for themselves
    if credential_data.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create credentials for another user.",
        )

    credential = await credential_service.create_credential(
        user_id=credential_data.user_id,
        credential_type=credential_data.credential_type,
        data=credential_data.credentials_data,
    )

    return CredentialRead(
        id=credential.id,
        user_id=credential.user_id,
        credential_type=credential.credential_type,
        credentials_data=credential_data.credentials_data,  # Note: In production, decrypt this
        created_at=credential.created_at,
        updated_at=credential.updated_at,
    )


# ===== LEAD WEBHOOK ENDPOINTS (EXISTING) =====


@router.post("/lead-webhook/generate", response_model=CredentialRead)
async def generate_lead_webhook_secret(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    credential = await credential_service.generate_and_store_lead_webhook_credential(
        user_id=current_user.id
    )
    return credential


@router.get("/lead-webhook", response_model=CredentialRead)
async def get_lead_webhook_secret(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    credential = await credential_service.get_lead_webhook_credential_with_url(
        user_id=current_user.id
    )

    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead webhook secret not found for this user.",
        )
    return credential


@router.delete("/lead-webhook", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead_webhook_secret(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    success = await credential_service.delete_lead_webhook_credential(
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead webhook secret not found for this user.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
