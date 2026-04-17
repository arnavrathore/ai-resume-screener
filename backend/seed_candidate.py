"""
seed_candidate.py — Create a single candidate user in the database.

This script creates a candidate account with the following credentials:
  Email: candidate@email.com
  Password: password123
  Role: candidate

The password is hashed using bcrypt before being stored in the database.

Run: python -m seed_candidate
"""

import asyncio
from app.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


async def seed_candidate():
    """Create a candidate user account."""
    async with AsyncSessionLocal() as session:
        try:
            # Check if candidate already exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.email == "candidate@email.com")
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print("⚠️  Candidate user already exists (candidate@email.com)")
                return

            # Create candidate user with bcrypt-hashed password
            candidate_user = User(
                email="candidate@email.com",
                full_name="John Candidate",
                hashed_password=hash_password("password123"),
                role="candidate",
                is_active=True,
            )
            session.add(candidate_user)
            await session.commit()

            print("✅ Candidate user created successfully!")
            print("   Email: candidate@email.com")
            print("   Password: password123")
            print("   Role: candidate")

        except Exception as e:
            await session.rollback()
            print(f"❌ Failed to create candidate user: {e}")


if __name__ == "__main__":
    asyncio.run(init_db())
    asyncio.run(seed_candidate())
