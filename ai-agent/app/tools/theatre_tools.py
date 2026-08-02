from typing import Optional

import httpx

from ..config import BACKEND_BASE_URL

GET_THEATRES_TIMEOUT_SECONDS = 10.0

# Exactly the fields the existing GET /api/theatres endpoint returns (see
# backend/src/modules/theatres/theatre.repository.ts). Not passing through
# createdAt/updatedAt (not useful to the agent). Note: the theatres table
# has address/latitude/longitude/facilities columns in Postgres (migration
# 006), but theatre.repository.ts's SELECT does not fetch them, so the API
# does not expose them today — nothing is invented here, this tool simply
# can't return fields the backend itself doesn't return.
_THEATRE_FIELDS = ("id", "name", "location", "locationId", "totalSeats")


async def get_theatres(location_id: Optional[str] = None) -> dict:
    """Retrieves the real theatres from the Smart Movie Booking backend.

    Call this whenever the user asks what theatres/cinemas exist, optionally
    in a specific city. This tool does NOT know which movies are currently
    showing at a theatre — it only returns theatre identity/location data.
    Never use it to claim a specific theatre is screening a specific movie.

    Args:
        location_id: Optional backend location/city id to filter theatres
            to that city. The backend's theatres endpoint does not support
            server-side location filtering, so this tool fetches all
            theatres and filters them itself by their locationId — the
            data returned is still exactly what the backend provided,
            nothing is invented. Only pass this if you already know the
            exact id (e.g. from get_locations) — omit it to get theatres
            across all locations.

    Returns:
        On success: {"status": "success", "count": int, "theatres": [
            {"id", "name", "location", "locationId", "totalSeats"}, ...
        ]} — "theatres" is an empty list (not an error) if none match.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_THEATRES_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/theatres")
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching theatres from the backend.",
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
                f"(HTTP {response.status_code}) while fetching theatres."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    theatres = data.get("theatres") if isinstance(data, dict) else None
    if not isinstance(theatres, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    if location_id:
        theatres = [
            theatre
            for theatre in theatres
            if isinstance(theatre, dict) and theatre.get("locationId") == location_id
        ]

    simplified = [
        {field: theatre.get(field) for field in _THEATRE_FIELDS}
        for theatre in theatres
        if isinstance(theatre, dict)
    ]

    return {"status": "success", "count": len(simplified), "theatres": simplified}
