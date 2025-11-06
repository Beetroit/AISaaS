from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding="utf-8", env_file=[".env", ".env.local"], extra="ignore"
    )

    app_name: str = "AgentSync Pro"
    admin_email: str = "admin@agentsync.pro"
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    openai_api_key: str
    gpt5_model: str = "gpt-5"
    gpt5_mini_model: str = "gpt-5-mini"
    gpt5_nano_model: str = "gpt-5-nano"
    chroma_host: str = "chroma"
    chroma_port: int = 8000
    chroma_db_dir: str = "./chroma_db"
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


settings = Settings.model_validate({})
