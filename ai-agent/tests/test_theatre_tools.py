import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.theatre_tools import get_theatres

THEATRES_URL = f"{BACKEND_BASE_URL}/api/theatres"


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_returns_only_the_fields_the_backend_exposes():
    respx.get(THEATRES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "theatres": [
                    {
                        "id": "theatre-1",
                        "name": "Carnival Cineplex",
                        "location": "Kolkata",
                        "locationId": "loc-1",
                        "totalSeats": 960,
                        # Real fields the backend also returns but that the
                        # tool should not pass through to the agent.
                        "createdAt": "2026-01-01T00:00:00.000Z",
                        "updatedAt": "2026-01-01T00:00:00.000Z",
                    }
                ]
            },
        )
    )

    result = await get_theatres()

    assert result == {
        "status": "success",
        "count": 1,
        "theatres": [
            {
                "id": "theatre-1",
                "name": "Carnival Cineplex",
                "location": "Kolkata",
                "locationId": "loc-1",
                "totalSeats": 960,
            }
        ],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_filters_by_location_id_client_side():
    respx.get(THEATRES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "theatres": [
                    {"id": "t1", "name": "A", "location": "Kolkata", "locationId": "loc-1", "totalSeats": 100},
                    {"id": "t2", "name": "B", "location": "Delhi", "locationId": "loc-2", "totalSeats": 200},
                    {"id": "t3", "name": "C", "location": "Kolkata", "locationId": "loc-1", "totalSeats": 150},
                ]
            },
        )
    )

    result = await get_theatres(location_id="loc-1")

    assert result["status"] == "success"
    assert result["count"] == 2
    assert {t["id"] for t in result["theatres"]} == {"t1", "t3"}
    assert all(t["locationId"] == "loc-1" for t in result["theatres"])


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_empty_list_is_success_not_error():
    respx.get(THEATRES_URL).mock(return_value=httpx.Response(200, json={"theatres": []}))

    result = await get_theatres()

    assert result == {"status": "success", "count": 0, "theatres": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_location_filter_with_no_matches_is_success_not_error():
    respx.get(THEATRES_URL).mock(
        return_value=httpx.Response(
            200,
            json={"theatres": [{"id": "t1", "name": "A", "location": "Delhi", "locationId": "loc-2", "totalSeats": 100}]},
        )
    )

    result = await get_theatres(location_id="loc-does-not-exist")

    assert result == {"status": "success", "count": 0, "theatres": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_backend_http_error():
    respx.get(THEATRES_URL).mock(
        return_value=httpx.Response(500, json={"message": "Internal server error"})
    )

    result = await get_theatres()

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_timeout():
    respx.get(THEATRES_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_theatres()

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching theatres from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_connection_error():
    respx.get(THEATRES_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_theatres()

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_theatres_invalid_json_response():
    respx.get(THEATRES_URL).mock(
        return_value=httpx.Response(
            200, content=b"not json", headers={"content-type": "application/json"}
        )
    )

    result = await get_theatres()

    assert result["status"] == "error"
