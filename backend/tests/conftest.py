"""
Shared test fixtures for the FastAPI backend test suite.

Provides:
- A mocked async database session (no real DB connection needed)
- A mocked Supabase auth dependency (admin and regular user)
- An async HTTPX TestClient wired with dependency overrides
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from auth import UserInfo, get_current_user, require_admin
from database import get_db

# ---------------------------------------------------------------------------
# 1. Fake database session
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_db():
    """
    Returns an AsyncMock that stands in for ``AsyncSession``.

    Tests can configure return values per-query:
        mock_db.execute.return_value.scalars.return_value.all.return_value = [...]
    """
    session = AsyncMock()
    # Common chained methods used by SQLAlchemy async queries
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.add = MagicMock()  # synchronous in SQLAlchemy
    return session


# ---------------------------------------------------------------------------
# 2. Fake authenticated users
# ---------------------------------------------------------------------------

@pytest.fixture()
def admin_user() -> UserInfo:
    """A fake admin user injected in place of the real auth dependency."""
    return UserInfo(
        id=str(uuid.uuid4()),
        email="admin@test.com",
        role="admin",
    )


@pytest.fixture()
def regular_user() -> UserInfo:
    """A fake non-admin user."""
    return UserInfo(
        id=str(uuid.uuid4()),
        email="parent@test.com",
        role="user",
    )


# ---------------------------------------------------------------------------
# 3. Async test client (HTTPX + FastAPI)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def client(mock_db, admin_user):
    """
    Yields an ``httpx.AsyncClient`` that:
    - overrides ``get_db`` with the mock session
    - overrides ``get_current_user`` and ``require_admin`` with admin_user

    Usage in tests:
        async def test_something(client):
            resp = await client.get("/health")
    """
    # Import app inside the fixture so module-level side effects
    # (engine creation, etc.) don't break when env vars are absent.
    from main import app

    # Wire mock dependencies
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[require_admin] = lambda: admin_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # Cleanup overrides so other test modules get a fresh app
    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def unauthed_client(mock_db):
    """
    A client with DB mocked but **no** auth overrides.
    Useful for testing 401 / 403 paths.
    """
    from main import app

    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def user_client(mock_db, regular_user):
    """
    A client authenticated as a regular (non-admin) user.
    Useful for testing 403 on admin-only endpoints.
    """
    from main import app

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: regular_user
    # NOTE: require_admin is NOT overridden — the real check runs,
    # so admin-only routes will correctly return 403.

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
