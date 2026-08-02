import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.movie_tools import get_movies

MOVIES_URL = f"{BACKEND_BASE_URL}/api/movies"


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_returns_only_the_fields_the_backend_exposes():
    respx.get(MOVIES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "movies": [
                    {
                        "id": "m1",
                        "title": "Test Movie",
                        "genre": "Action",
                        "language": "English",
                        "durationMinutes": 120,
                        "releaseDate": "2026-01-01",
                        # Real fields the backend also returns but that the
                        # tool should not pass through to the agent.
                        "createdAt": "2026-01-01T00:00:00.000Z",
                        "updatedAt": "2026-01-01T00:00:00.000Z",
                    }
                ]
            },
        )
    )

    result = await get_movies()

    assert result == {
        "status": "success",
        "count": 1,
        "movies": [
            {
                "id": "m1",
                "title": "Test Movie",
                "genre": "Action",
                "language": "English",
                "durationMinutes": 120,
                "releaseDate": "2026-01-01",
            }
        ],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_passes_location_id_as_a_query_param():
    route = respx.get(MOVIES_URL).mock(return_value=httpx.Response(200, json={"movies": []}))

    await get_movies(location_id="loc-123")

    assert route.called
    assert route.calls.last.request.url.params["locationId"] == "loc-123"


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_omits_the_query_param_when_no_location_given():
    route = respx.get(MOVIES_URL).mock(return_value=httpx.Response(200, json={"movies": []}))

    await get_movies()

    assert route.called
    assert "locationId" not in route.calls.last.request.url.params


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_empty_list_is_success_not_error():
    respx.get(MOVIES_URL).mock(return_value=httpx.Response(200, json={"movies": []}))

    result = await get_movies()

    assert result == {"status": "success", "count": 0, "movies": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_backend_http_error():
    respx.get(MOVIES_URL).mock(
        return_value=httpx.Response(500, json={"message": "Internal server error"})
    )

    result = await get_movies()

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_connection_error():
    respx.get(MOVIES_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_movies()

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_timeout():
    respx.get(MOVIES_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_movies()

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching movies from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_movies_invalid_json_response():
    respx.get(MOVIES_URL).mock(
        return_value=httpx.Response(200, content=b"not json", headers={"content-type": "application/json"})
    )

    result = await get_movies()

    assert result["status"] == "error"
