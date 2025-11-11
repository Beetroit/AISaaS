from fastapi import APIRouter, HTTPException, Response, status

from backend.app.dependencies import CredentialServiceDep, CurrentUser
from backend.app.schemas.credential import CredentialRead

router = APIRouter(prefix="/credentials", tags=["Credentials"])


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
