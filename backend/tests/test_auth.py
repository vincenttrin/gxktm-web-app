"""
Example tests for the /api/auth/* endpoints.

Demonstrates:
- Mocking Supabase auth via dependency injection
- Testing authenticated vs unauthenticated requests
- Testing admin vs regular-user access control
"""

import pytest


# ---------------------------------------------------------------------------
# GET /api/auth/me — requires authentication
# ---------------------------------------------------------------------------

class TestGetCurrentUser:
    """Tests for the ``/api/auth/me`` endpoint."""

    @pytest.mark.asyncio
    async def test_returns_admin_info(self, client, admin_user):
        """An admin user receives their own info."""
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 200

        data = resp.json()
        assert data["email"] == admin_user.email
        assert data["role"] == "admin"
        assert data["is_admin"] is True

    @pytest.mark.asyncio
    async def test_returns_regular_user_info(self, user_client, regular_user):
        """A regular user receives their own info (non-admin)."""
        resp = await user_client.get("/api/auth/me")
        assert resp.status_code == 200

        data = resp.json()
        assert data["email"] == regular_user.email
        assert data["role"] == "user"
        assert data["is_admin"] is False

    @pytest.mark.asyncio
    async def test_unauthenticated_returns_401(self, unauthed_client):
        """Unauthenticated requests to /api/auth/me return 401."""
        resp = await unauthed_client.get("/api/auth/me")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/auth/admin-check — requires admin role
# ---------------------------------------------------------------------------

class TestAdminCheck:
    """Tests for the ``/api/auth/admin-check`` endpoint."""

    @pytest.mark.asyncio
    async def test_admin_passes(self, client):
        """Admin users pass the admin check."""
        resp = await client.get("/api/auth/admin-check")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_regular_user_gets_403(self, user_client):
        """Non-admin users receive 403 Forbidden."""
        resp = await user_client.get("/api/auth/admin-check")
        assert resp.status_code == 403
