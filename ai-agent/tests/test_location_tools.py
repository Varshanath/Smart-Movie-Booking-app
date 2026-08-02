import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.location_tools import get_locations

LOCATIONS_URL = f"{BACKEND_BASE_URL}/api/locations"


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_returns_only_the_fields_the_backend_exposes():
    respx.get(LOCATIONS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "locations": [
                    {
                        "id": "loc-1",
                        "name": "Kolkata",
                        # Real fields the backend also returns but that the
                        # tool should not pass through to the agent.
                        "createdAt": "2026-01-01T00:00:00.000Z",
                        "updatedAt": "2026-01-01T00:00:00.000Z",
                    }
                ]
            },
        )
    )

    result = await get_locations()

    assert result == {
        "status": "success",
        "count": 1,
        "locations": [{"id": "loc-1", "name": "Kolkata"}],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_empty_list_is_success_not_error():
    respx.get(LOCATIONS_URL).mock(return_value=httpx.Response(200, json={"locations": []}))

    result = await get_locations()

    assert result == {"status": "success", "count": 0, "locations": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_connection_error():
    respx.get(LOCATIONS_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_locations()

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_timeout():
    respx.get(LOCATIONS_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_locations()

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching locations from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_invalid_json_response():
    respx.get(LOCATIONS_URL).mock(
        return_value=httpx.Response(
            200, content=b"not json", headers={"content-type": "application/json"}
        )
    )

    result = await get_locations()

    assert result["status"] == "error"


@pytest.mark.asyncio
@respx.mock
async def test_get_locations_backend_http_error():
    respx.get(LOCATIONS_URL).mock(
        return_value=httpx.Response(500, json={"message": "Internal server error"})
    )

    result = await get_locations()

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]
