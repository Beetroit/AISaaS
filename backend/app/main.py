import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

# Configure logging
from scalar_fastapi.scalar_fastapi import get_scalar_api_reference  # type: ignore

from backend.app.config import logger
from backend.app.dependencies import CurrentUser
from backend.app.schemas import user as schemas_user

from .routers import (
    agents,
    appointments,
    auth,
    credentials,
    documents,
    leads,
    pricing,
    reports,
    stripe_api,
    webhooks,
    workflow,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://aisaasfe.t.lum.tools",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "User-Agent"],
)


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
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(credentials.router)
app.include_router(pricing.router)
app.include_router(workflow.router)


@app.get("/users/me", response_model=schemas_user.UserResponse)
async def read_users_me(current_user: CurrentUser):
    agent_ids = [agent.id for agent in current_user.agents]
    return schemas_user.UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        message_credits=current_user.message_credits,
        agent_ids=agent_ids,
    )


@app.get("/scalar", include_in_schema=False)
async def scalar_html() -> HTMLResponse:
    return get_scalar_api_reference(openapi_url=str(app.openapi_url), title=app.title)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Hello World"}
