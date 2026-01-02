import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import sys

# 1. Retrieve the Database URL from the environment
# We default to an empty string to avoid errors if the file is missing,
# but in production, this should always be set.
DATABASE_URL = os.getenv("DATABASE_URL")

# --- ADD THIS BLOCK FOR DEBUGGING ---
print("--- DEBUGGING DATABASE CONNECTION ---")
if DATABASE_URL is None:
    print("ERROR: DATABASE_URL is None. The environment variable is missing.")
else:
    # WARNING: This prints your password to logs. Remove after fixing!
    print(f"Attempting to connect to: {DATABASE_URL}")
print("-------------------------------------")
sys.stdout.flush() # Forces Docker to show this immediately
# ------------------------------------

# CRITICAL FIX for Supabase/Async:
# The standard URL starts with "postgresql://".
# We need to tell SQLAlchemy to use the "asyncpg" driver for speed.
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# 2. Create the "Engine"
# The engine is the central connection point to the database.
# echo=True prints the actual SQL queries to your console (great for debugging).
engine = create_async_engine(DATABASE_URL, echo=True)

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