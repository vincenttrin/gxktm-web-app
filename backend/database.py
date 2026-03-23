import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set.")

# Use asyncpg driver for async support
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DEBUG = os.getenv("DEBUG", "").lower() == "true"

engine = create_async_engine(DATABASE_URL, echo=DEBUG)

# 3. Create the "Session Factory"
# A "Session" is a temporary workspace for your database operations.
# Imagine the Engine is the bank, and a Session is a single transaction window.
SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False, # Prevents attributes from expiring after a commit
)

# 4. Create the "Base" Class
# Later, when we create models (like Student or Class), they will inherit from this.
# It allows SQLAlchemy to track them and map them to database tables.
class Base(DeclarativeBase):
    pass

# 5. The Dependency
# This is a helper function used by your API endpoints.
# It creates a new database session for a request and closes it when done.
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            # This block runs even if there is an error, ensuring
            # the connection is always closed so we don't leak resources.
            await session.close()