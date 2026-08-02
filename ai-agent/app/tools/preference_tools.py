import httpx

from ..config import BACKEND_BASE_URL

GET_USER_PREFERENCES_TIMEOUT_SECONDS = 10.0

# Exactly the fields the existing GET /api/users/{userId}/preferences endpoint
# returns (see backend/src/modules/catalog/catalog.repository.ts,
# listUserPreferences). userId is dropped since the caller already supplied
# it. Nothing is invented — in particular, genreId/languageId are raw ids;
# the endpoint does not join genre/language names.
_PREFERENCE_FIELDS = ("id", "genreId", "languageId", "createdAt")


async def get_user_preferences(user_id: str) -> dict:
    """Retrieves a user's explicit, stored movie preferences (favourite genre/language).

    Call this only when the user asks for a personalized recommendation or
    otherwise wants suggestions tailored to them — never for generic "what's
    available" questions. Use the user_id the application supplied for this
    conversation; never ask the end user to type out their own user id, and
    never invent preferences that this tool didn't actually return.

    Args:
        user_id: The backend user id to look up preferences for.

    Returns:
        On success: {"status": "success", "count": int, "preferences": [
            {"id": str, "genreId": str | None, "languageId": str | None,
             "createdAt": str}, ...
        ]} — "preferences" is an empty list (not an error) if the user has
        none stored yet; treat that as "personalization is limited", not as
        a failure.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_USER_PREFERENCES_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/users/{user_id}/preferences")
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching preferences from the backend.",
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
                f"(HTTP {response.status_code}) while fetching preferences."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    preferences = data.get("preferences") if isinstance(data, dict) else None
    if not isinstance(preferences, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    simplified = [
        {field: preference.get(field) for field in _PREFERENCE_FIELDS}
        for preference in preferences
        if isinstance(preference, dict)
    ]

    return {"status": "success", "count": len(simplified), "preferences": simplified}
