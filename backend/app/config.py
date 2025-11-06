from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
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


settings = Settings.model_validate({})
