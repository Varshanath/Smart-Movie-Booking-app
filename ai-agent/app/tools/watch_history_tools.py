import httpx

from ..config import BACKEND_BASE_URL

GET_WATCH_HISTORY_TIMEOUT_SECONDS = 10.0

# Exactly the fields the existing GET /api/users/{userId}/watch-history
# endpoint returns (see backend/src/modules/catalog/catalog.repository.ts,
# listWatchHistory). userId is dropped since the caller already supplied it.
# The endpoint does not join movie titles or any rating/review data, so
# nothing beyond movieId/watchedAt is available here — do not invent it.
_WATCH_HISTORY_FIELDS = ("id", "movieId", "watchedAt")


async def get_watch_history(user_id: str) -> dict:
    """Retrieves the real movies a user has previously watched, as recorded by the backend.

    Call this only when the user asks for a personalized recommendation or
    otherwise wants suggestions based on what they've watched before — never
    for generic "what's available" questions. This tool only tells you
    WHICH movies were watched — it does NOT tell you whether the user liked
    them, so never assume watching a movie means the user enjoyed it. If a
    future version of this tool starts returning rating/review fields, only
    use those fields if they actually appear in the response — never invent
    them.

    Args:
        user_id: The backend user id to look up watch history for.

    Returns:
        On success: {"status": "success", "count": int, "watchHistory": [
            {"id": str, "movieId": str, "watchedAt": str}, ...
        ]} — "watchHistory" is an empty list (not an error) if the user
        hasn't watched anything yet.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_WATCH_HISTORY_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/users/{user_id}/watch-history")
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching watch history from the backend.",
        }
    except httpx.RequestError:
        return {
            "status": "error",
            "error_message": "Could not connect to the movie booking backend.",
        }

    if response.status_code != 200:
        return {
            "status": "error",
            "error_message": (
                f"The movie booking backend returned an error "
                f"(HTTP {response.status_code}) while fetching watch history."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    watch_history = data.get("watchHistory") if isinstance(data, dict) else None
    if not isinstance(watch_history, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    simplified = [
        {field: entry.get(field) for field in _WATCH_HISTORY_FIELDS}
        for entry in watch_history
        if isinstance(entry, dict)
    ]

    return {
        "status": "success",
        "count": len(simplified),
        "watchHistory": simplified,
    }
