"""
Example tests for the /api/families endpoints.

Demonstrates:
- Mocking the SQLAlchemy async session for GET and POST
- Verifying response shapes against Pydantic schemas
- Admin-only endpoint protection
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest


# ---------------------------------------------------------------------------
# Helpers — lightweight fakes that mimic SQLAlchemy model instances
# ---------------------------------------------------------------------------

def _make_fake_family(
    family_name="Nguyen Family",
    city="Houston",
    state="TX",
    zip_code="77001",
):
    """Return a MagicMock that looks like a ``Family`` model instance."""
    family = MagicMock()
    family.id = uuid.uuid4()
    family.family_name = family_name
    family.address = "123 Main St"
    family.city = city
    family.state = state
    family.zip_code = zip_code
    family.diocese_id = None
    family.guardians = []
    family.students = []
    family.emergency_contacts = []
    return family


# ---------------------------------------------------------------------------
# GET /api/families/all
# ---------------------------------------------------------------------------

class TestGetAllFamilies:

    @pytest.mark.asyncio
    async def test_returns_list(self, client, mock_db):
        """GET /api/families/all returns a list of families."""
        fake_families = [_make_fake_family(), _make_fake_family("Tran Family")]

        # Wire the mock: db.execute(...) → result.scalars().all() → fake list
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = fake_families
        mock_db.execute.return_value = mock_result

        resp = await client.get("/api/families/all")
        assert resp.status_code == 200

        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["family_name"] == "Nguyen Family"
        assert data[1]["family_name"] == "Tran Family"

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_families(self, client, mock_db):
        """GET /api/families/all returns [] when the table is empty."""
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        resp = await client.get("/api/families/all")
        assert resp.status_code == 200
        assert resp.json() == []


# ---------------------------------------------------------------------------
# POST /api/families — create a new family (admin only)
# ---------------------------------------------------------------------------

class TestCreateFamily:

    @pytest.mark.asyncio
    async def test_create_family_success(self, client, mock_db):
        """POST /api/families with valid payload returns 201."""
        fake_family = _make_fake_family()

        # After commit, the router re-fetches with relationships.
        mock_result = AsyncMock()
        mock_result.scalar_one.return_value = fake_family
        mock_db.execute.return_value = mock_result

        payload = {
            "family_name": "Nguyen Family",
            "address": "123 Main St",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001",
            "guardians": [],
            "students": [],
            "emergency_contacts": [],
        }

        resp = await client.post("/api/families", json=payload)
        assert resp.status_code == 201

        data = resp.json()
        assert data["family_name"] == "Nguyen Family"
        assert data["city"] == "Houston"

        # Verify side-effects on the mock session
        mock_db.add.assert_called()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_family_with_guardians(self, client, mock_db):
        """POST /api/families with nested guardians works."""
        fake_family = _make_fake_family()
        # Simulate a guardian attached after creation
        guardian = MagicMock()
        guardian.id = uuid.uuid4()
        guardian.family_id = fake_family.id
        guardian.name = "Jane Nguyen"
        guardian.email = "jane@example.com"
        guardian.phone = "555-1234"
        guardian.relationship_to_family = "Mother"
        fake_family.guardians = [guardian]

        mock_result = AsyncMock()
        mock_result.scalar_one.return_value = fake_family
        mock_db.execute.return_value = mock_result

        payload = {
            "family_name": "Nguyen Family",
            "address": "123 Main St",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001",
            "guardians": [
                {
                    "name": "Jane Nguyen",
                    "email": "jane@example.com",
                    "phone": "555-1234",
                    "relationship_to_family": "Mother",
                }
            ],
            "students": [],
            "emergency_contacts": [],
        }

        resp = await client.post("/api/families", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert len(data["guardians"]) == 1
        assert data["guardians"][0]["name"] == "Jane Nguyen"

    @pytest.mark.asyncio
    async def test_regular_user_cannot_create_family(self, user_client):
        """A non-admin user receives 403 when trying to create a family."""
        payload = {
            "family_name": "Blocked Family",
            "guardians": [],
            "students": [],
            "emergency_contacts": [],
        }
        resp = await user_client.post("/api/families", json=payload)
        assert resp.status_code == 403
