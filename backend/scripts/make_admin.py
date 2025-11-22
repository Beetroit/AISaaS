import asyncio
import argparse
import sys
import os

# Add the project root to the python path
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from sqlalchemy import select, func
from backend.app.database import AsyncSessionLocal
from backend.app.models.user import User


async def make_admin(email: str):
    async with AsyncSessionLocal() as session:
        # Find the user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user:
            print(f"Error: User with email '{email}' not found.")
            return

        if user.is_admin:
            print(f"User '{email}' is already an admin.")
            if user.is_super_admin:
                print(f"User '{email}' is also a Super Admin.")
            return

        # Check if any admins exist
        admin_count_result = await session.execute(
            select(func.count()).select_from(User).where(User.is_admin)
        )
        admin_count = admin_count_result.scalar_one()

        user.is_admin = True

        # If no admins exist, make this user a Super Admin
        if admin_count == 0:
            user.is_super_admin = True
            print(f"No existing admins found. Promoting '{email}' to SUPER ADMIN.")
        else:
            print(f"Promoting '{email}' to Admin.")

        await session.commit()
        print("Success.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to Admin.")
    parser.add_argument("email", help="The email address of the user to promote")
    args = parser.parse_args()

    asyncio.run(make_admin(args.email))
