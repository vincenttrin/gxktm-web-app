"""
Example tests for unauthenticated GET endpoints (/, /health).

These demonstrate:
- Basic async test structure
- Using the ``client`` fixture from conftest.py
"""

import pytest


# ---------------------------------------------------------------------------
# GET / — root endpoint (no auth required)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_read_root(client):
    """GET / returns a welcome message."""
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert "running" in data["message"].lower()


# ---------------------------------------------------------------------------
# GET /health — simple health check
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_check(client):
    """GET /health returns status ok."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
