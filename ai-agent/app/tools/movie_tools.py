from typing import Optional

import httpx

from ..config import BACKEND_BASE_URL

GET_MOVIES_TIMEOUT_SECONDS = 10.0

# Exactly the fields the existing GET /api/movies endpoint returns (see
# backend/src/modules/movies/movie.repository.ts). Deliberately not passing
# createdAt/updatedAt through (not useful to the agent) and not inventing
# fields like rating/poster_url/description — the backend doesn't expose
# those today.
_MOVIE_FIELDS = ("id", "title", "genre", "language", "durationMinutes", "releaseDate")


async def get_movies(location_id: Optional[str] = None) -> dict:
    """Retrieves the real, currently available movies from the Smart Movie Booking backend.

    Call this whenever the user asks what movies are available/showing, or
    asks for a movie recommendation or suggestion — this is the only source
    of truth for what movies actually exist. Never invent movie titles, and
    never claim a movie is available unless this tool actually returned it.

    Args:
        location_id: Optional backend location/city id to filter movies to
            those with showtimes in that city. Only pass this if you already
            know the exact id (e.g. it was given to you explicitly) — there
            is no tool yet to look up a location's id from a city name. Omit
            it to get movies across all locations.

    Returns:
        On success: {"status": "success", "count": int, "movies": [
            {"id", "title", "genre", "language", "durationMinutes", "releaseDate"}, ...
        ]} — "movies" is an empty list (not an error) when nothing is showing.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    params = {"locationId": location_id} if location_id else None

    try:
        async with httpx.AsyncClient(timeout=GET_MOVIES_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/movies", params=params)
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching movies from the backend.",
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
                f"(HTTP {response.status_code}) while fetching movies."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    movies = data.get("movies") if isinstance(data, dict) else None
    if not isinstance(movies, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    simplified = [
        {field: movie.get(field) for field in _MOVIE_FIELDS}
        for movie in movies
        if isinstance(movie, dict)
    ]

    return {"status": "success", "count": len(simplified), "movies": simplified}
