from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from backend.app.models.user import User  # Import specific model for type hinting
from backend.app.schemas import user as schemas_user
from backend.app.security import get_current_user

from .routers import auth, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])


@app.get("/")
async def root():
    return {"message": "AgentSync Pro Backend"}


@app.get("/users/me", response_model=schemas_user.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
