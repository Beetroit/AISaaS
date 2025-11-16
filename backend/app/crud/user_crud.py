from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.user import User


class UserCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create_user(self, email: str, hashed_password: str) -> User:
        db_user = User(email=email, hashed_password=hashed_password)
        self.session.add(db_user)
        await self.session.flush()
        return db_user

    async def authenticate_user(self, email: str, password: str) -> User | None:
        from backend.app.security import verify_password

        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
