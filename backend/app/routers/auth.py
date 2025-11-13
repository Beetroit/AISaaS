import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google_auth_oauthlib.flow import Flow

from backend.app.config import redis_client, settings
from backend.app.dependencies import CurrentUser, DBSession, UserCRUDDep
from backend.app.schemas import user as user_schema
from backend.app.schemas.token import Token
from backend.app.security import create_access_token, get_password_hash
from backend.app.services.credential_service import CredentialService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar"]


@router.get("/users/me/credits", response_model=int)
async def get_my_credits(current_user: CurrentUser):
    return current_user.message_credits


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_crud: UserCRUDDep,
):
    user = await user_crud.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(user=user)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=user_schema.UserResponse)
async def register_user(
    user_create: user_schema.UserCreate,
    user_crud: UserCRUDDep,
):
    db_user = await user_crud.get_user_by_email(user_create.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user_create.password)
    user = await user_crud.create_user(user_create.email, hashed_password)
    return user


@router.get("/google/authorize")
async def google_authorize(current_user: CurrentUser):
    state = secrets.token_urlsafe(32)
    await redis_client.setex(f"oauth_state:{current_user.id}", 300, state)

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [settings.google_redirect_uri],
                "javascript_origins": [],
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=state,
    )
    return Response(headers={"Location": authorization_url}, status_code=302)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: DBSession,
    current_user: CurrentUser,
):
    expected_state = await redis_client.get(f"oauth_state:{current_user.id}")
    if expected_state:
        await redis_client.delete(f"oauth_state:{current_user.id}")
        if expected_state.decode("utf-8") != state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired state parameter.",
        )

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [settings.google_redirect_uri],
                "javascript_origins": [],
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    flow.fetch_token(code=code)

    credentials = flow.credentials
    credential_service = CredentialService(db)
    await credential_service.save_google_tokens(current_user.id, credentials.to_json())

    return {"message": "Google Calendar connected successfully!"}
