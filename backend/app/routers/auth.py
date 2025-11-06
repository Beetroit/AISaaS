from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.crud.user_crud import UserCRUD
from backend.app.schemas import user as schemas_user
from backend.app.dependencies import get_user_crud
from backend.app.security import verify_password, create_access_token
from backend.app.config import settings

router = APIRouter()


@router.post("/register", response_model=schemas_user.UserResponse)
async def register_user(
    user: schemas_user.UserCreate, user_crud: UserCRUD = Depends(get_user_crud)
):
    db_user = await user_crud.get_user_by_email(email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_crud.create_user(user=user)


@router.post("/token", response_model=schemas_user.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_crud: UserCRUD = Depends(get_user_crud),
):
    user = await user_crud.get_user_by_email(email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
