from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google_auth_oauthlib.flow import Flow

from backend.app.config import settings
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
    flow = Flow.from_client_secrets_file(
        "client_secret.json",  # This file needs to be created/managed securely
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    authorization_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )
    # Store state in session or database associated with current_user for verification
    # For now, we'll just redirect
    return Response(headers={"Location": authorization_url}, status_code=302)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: DBSession,
    current_user: CurrentUser,
):
    # TODO: Verify state parameter to prevent CSRF attacks
    flow = Flow.from_client_secrets_file(
        "client_secret.json",  # This file needs to be created/managed securely
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    flow.fetch_token(code=code)

    credentials = flow.credentials
    credential_service = CredentialService(db)
    await credential_service.save_google_tokens(current_user.id, credentials.to_json())

    return {"message": "Google Calendar connected successfully!"}
