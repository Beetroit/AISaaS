import logging
from datetime import datetime, timezone

import redis.asyncio as redis
from pydantic_settings import BaseSettings, SettingsConfigDict
from rich.console import Console
from rich.logging import RichHandler

console = Console(
    force_terminal=True,
    width=None,
    safe_box=False,
    get_datetime=lambda: datetime.now(timezone.utc),
)
logging.basicConfig(
    level="INFO",
    format="%(asctime)s - %(name)s:%(lineno)d - %(levelname)s - %(message)s\n",
    datefmt="[%X]",
    handlers=[RichHandler(console=console, show_time=True, show_level=True)],
)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding="utf-8", env_file=[".env", ".env.local"], extra="ignore"
    )

    app_name: str = "AgentSync Pro"
    admin_email: str = "admin@agentsync.pro"
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    openai_api_key: str
    gpt5_model: str = "gpt-5"
    gpt5_mini_model: str = "gpt-5-mini"
    gpt5_nano_model: str = "gpt-5-nano"
    embedding_model: str = "text-embedding-3-small"
    chroma_host: str
    chroma_port: int
    chroma_db_dir: str
    stripe_public_key: str
    stripe_secret_key: str
    twilio_sid: str
    twilio_phone_number: str
    twilio_auth_token: str
    encryption_key: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    stripe_customer_portal_return_url: str
    stripe_webhook_secret: str
    backend_base_url: str
    redis_host: str = "localhost"
    redis_port: int = 6378
    allow_concurrent_twilio_use: bool = False  # New setting for admin override


settings = Settings.model_validate({})

redis_client = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=0)
