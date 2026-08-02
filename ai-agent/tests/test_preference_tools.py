import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.preference_tools import get_user_preferences

USER_ID = "user-1"
PREFERENCES_URL = f"{BACKEND_BASE_URL}/api/users/{USER_ID}/preferences"


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_returns_only_the_fields_the_backend_exposes():
    respx.get(PREFERENCES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "preferences": [
                    {
                        "id": "pref-1",
                        "userId": USER_ID,
                        "genreId": "genre-1",
                        "languageId": "lang-1",
                        "createdAt": "2026-01-01T00:00:00.000Z",
                    }
                ]
            },
        )
    )

    result = await get_user_preferences(USER_ID)

    assert result == {
        "status": "success",
        "count": 1,
        "preferences": [
            {
                "id": "pref-1",
                "genreId": "genre-1",
                "languageId": "lang-1",
                "createdAt": "2026-01-01T00:00:00.000Z",
            }
        ],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_empty_list_is_success_not_error():
    respx.get(PREFERENCES_URL).mock(return_value=httpx.Response(200, json={"preferences": []}))

    result = await get_user_preferences(USER_ID)

    assert result == {"status": "success", "count": 0, "preferences": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_connection_error():
    respx.get(PREFERENCES_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_user_preferences(USER_ID)

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_timeout():
    respx.get(PREFERENCES_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_user_preferences(USER_ID)

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching preferences from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_invalid_json_response():
    respx.get(PREFERENCES_URL).mock(
        return_value=httpx.Response(
            200, content=b"not json", headers={"content-type": "application/json"}
        )
    )

    result = await get_user_preferences(USER_ID)

    assert result["status"] == "error"


@pytest.mark.asyncio
@respx.mock
async def test_get_user_preferences_backend_http_error():
    respx.get(PREFERENCES_URL).mock(
        return_value=httpx.Response(500, json={"message": "Internal server error"})
    )

    result = await get_user_preferences(USER_ID)

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]
