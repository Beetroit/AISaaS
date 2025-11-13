import uuid
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from backend.app.config import redis_client, settings
from backend.app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


ph = PasswordHasher()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return ph.hash(password)


def create_access_token(user: User):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    jti = f"jti_{str(uuid.uuid4())}"
    to_encode = {
        "sub": user.id,
        "email": user.email,
        "iat": datetime.now(timezone.utc).timestamp(),
        "exp": expire.timestamp(),
        "is_active": user.is_active,
        "jti": jti,
    }
    encoded_jwt = jwt.encode(
        to_encode.copy(), settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


async def add_token_to_blacklist(token_jti: str, expires_at: datetime):
    """Adds a token's JTI to the Redis blacklist with an expiration."""
    now = datetime.now(timezone.utc)
    expiration_seconds = int((expires_at - now).total_seconds())
    if expiration_seconds > 0:
        await redis_client.setex(f"blacklist:{token_jti}", expiration_seconds, "true")


async def is_token_blacklisted(token_jti: str) -> bool:
    """Checks if a token's JTI is present in the Redis blacklist."""
    return await redis_client.exists(f"blacklist:{token_jti}")
