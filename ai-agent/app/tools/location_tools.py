import httpx

from ..config import BACKEND_BASE_URL

GET_LOCATIONS_TIMEOUT_SECONDS = 10.0

# Exactly the fields the existing GET /api/locations endpoint returns (see
# backend/src/modules/locations/location.repository.ts). createdAt/updatedAt
# are real fields too but not useful to the agent, so they're dropped here —
# nothing is invented.
_LOCATION_FIELDS = ("id", "name")


async def get_locations() -> dict:
    """Retrieves the real list of cities/locations the Smart Movie Booking app operates in.

    Call this whenever the user names a city (e.g. "movies in Kolkata", "what's
    showing in my city") and you don't already have that city's location id in
    this conversation. Match the user's city name against the "name" field of
    the locations this tool returns, then pass the matching "id" as
    location_id to get_movies. Never guess, invent, or reuse a location id
    from anywhere other than this tool's own output — if the user's city
    isn't in the returned list, tell them you couldn't find it.

    Returns:
        On success: {"status": "success", "count": int, "locations": [
            {"id": str, "name": str}, ...
        ]} — "locations" is an empty list (not an error) if none are
        configured.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_LOCATIONS_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/locations")
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching locations from the backend.",
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
                f"(HTTP {response.status_code}) while fetching locations."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    locations = data.get("locations") if isinstance(data, dict) else None
    if not isinstance(locations, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    simplified = [
        {field: location.get(field) for field in _LOCATION_FIELDS}
        for location in locations
        if isinstance(location, dict)
    ]

    return {"status": "success", "count": len(simplified), "locations": simplified}
