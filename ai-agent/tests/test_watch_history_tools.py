import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.watch_history_tools import get_watch_history

USER_ID = "user-1"
WATCH_HISTORY_URL = f"{BACKEND_BASE_URL}/api/users/{USER_ID}/watch-history"


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_returns_only_the_fields_the_backend_exposes():
    respx.get(WATCH_HISTORY_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "watchHistory": [
                    {
                        "id": "wh-1",
                        "userId": USER_ID,
                        "movieId": "movie-1",
                        "watchedAt": "2026-01-01T00:00:00.000Z",
                    }
                ]
            },
        )
    )

    result = await get_watch_history(USER_ID)

    assert result == {
        "status": "success",
        "count": 1,
        "watchHistory": [
            {
                "id": "wh-1",
                "movieId": "movie-1",
                "watchedAt": "2026-01-01T00:00:00.000Z",
            }
        ],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_empty_list_is_success_not_error():
    respx.get(WATCH_HISTORY_URL).mock(return_value=httpx.Response(200, json={"watchHistory": []}))

    result = await get_watch_history(USER_ID)

    assert result == {"status": "success", "count": 0, "watchHistory": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_connection_error():
    respx.get(WATCH_HISTORY_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_watch_history(USER_ID)

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_timeout():
    respx.get(WATCH_HISTORY_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_watch_history(USER_ID)

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching watch history from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_invalid_json_response():
    respx.get(WATCH_HISTORY_URL).mock(
        return_value=httpx.Response(
            200, content=b"not json", headers={"content-type": "application/json"}
        )
    )

    result = await get_watch_history(USER_ID)

    assert result["status"] == "error"


@pytest.mark.asyncio
@respx.mock
async def test_get_watch_history_backend_http_error():
    respx.get(WATCH_HISTORY_URL).mock(
        return_value=httpx.Response(500, json={"message": "Internal server error"})
    )

    result = await get_watch_history(USER_ID)

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]
