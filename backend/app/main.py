import logging
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from scalar_fastapi.scalar_fastapi import get_scalar_api_reference  # type: ignore

from backend.app.dependencies import get_current_user
from backend.app.models.user import User  # Import specific model for type hinting
from backend.app.schemas import user as schemas_user

from .routers import agents, appointments, auth, documents, stripe_api, webhooks

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s:%(lineno)d - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    yield


app = FastAPI(lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # TODO: Update this to return single regex error message
    error_messages = [
        {
            "loc": error["loc"][0],
            "field_name": error["loc"][-1],
            # TODO: This could be cleaner
            "message": error["msg"].replace("Value error, ", ""),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=400,
        content={"errors": error_messages},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    logger.error(traceback.format_exc())
    return JSONResponse(
        content={"message": str(exc.detail)}, status_code=exc.status_code
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected internal server error occurred."},
    )


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(webhooks.router)
app.include_router(stripe_api.router)
app.include_router(agents.router)
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])


app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).parent.parent.parent / "frontend" / "static"),
    name="static",
)


@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open(
        Path(__file__).parent.parent.parent / "frontend" / "static" / "index.html"
    ) as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/users/me", response_model=schemas_user.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    agent_ids = [agent.id for agent in current_user.agents]
    return schemas_user.UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        agent_ids=agent_ids,
    )


@app.get("/scalar", include_in_schema=False)
async def scalar_html() -> HTMLResponse:
    return get_scalar_api_reference(openapi_url=str(app.openapi_url), title=app.title)
