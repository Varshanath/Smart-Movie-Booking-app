import asyncio
from datetime import datetime
from typing import Optional

import httpx

from ..config import BACKEND_BASE_URL, INDIA_TZ

GET_SHOWTIMES_TIMEOUT_SECONDS = 10.0

# There is no single backend endpoint that joins movie -> theatre -> show.
# The show/screen/theatre endpoints are each unfiltered list endpoints (see
# backend/src/modules/shows/show.repository.ts and
# backend/src/modules/theatres/theatre.repository.ts) — no movieId,
# theatreId, locationId, or date query params exist on any of them. So this
# tool makes exactly 3 backend HTTP GET calls, every time, regardless of
# which filters are passed in:
#   GET /api/shows           -> {id, movieId, screenId, startTime, price}
#   GET /api/shows/screens   -> {id, theatreId, name, ...}
#   GET /api/theatres        -> {id, name, location, locationId, ...}
# and joins them in memory on real foreign keys (show.screenId ->
# screen.id, screen.theatreId -> theatre.id, theatre.locationId). This is
# the SAME list-then-join-in-memory pattern the Node backend's own
# movie.service.ts:getMovies(locationId) already uses internally for its
# locationId filter — not a new or riskier pattern, just the same one
# applied here in Python. It is O(1) requests (3), not O(N*M) — the cost
# scales with dataset size per request, not with the number of filters.
#
# movie_id is expected to already be resolved (e.g. via get_movies()) by
# the caller — this tool does not call GET /api/movies itself, since the
# caller already has the movie title from that earlier call and a 4th
# backend request here would be redundant.
_SHOW_FIELDS = ("id", "movieId", "screenId", "startTime", "price")


async def get_showtimes(
    movie_id: Optional[str] = None,
    theatre_id: Optional[str] = None,
    location_id: Optional[str] = None,
    date: Optional[str] = None,
) -> dict:
    """Retrieves real showtimes, optionally filtered by movie, theatre, city, and/or date.

    Call this only when the user is asking about showtimes: when/where a
    movie is playing, availability at a specific theatre, or shows on a
    particular date. Do not call this for generic movie or theatre
    discovery questions — use get_movies/get_theatres for those instead.

    Resolve names to ids with the other tools BEFORE calling this one:
    movie name -> movie_id via get_movies(); city name -> location_id via
    get_locations(); theatre name -> theatre_id via get_theatres(). Never
    guess or invent an id — only pass ids those tools actually returned.

    The backend has no field for a show's date/time in India time — its
    startTime is a UTC instant. This tool converts each show's startTime to
    India time (UTC+05:30, fixed offset — India does not observe DST) so
    the times/dates it returns are the real, correct local showtime, not
    raw UTC. This is a direct, lossless conversion of real data, not an
    invented value.

    Args:
        movie_id: Optional real movie id (from get_movies()) to filter to
            showtimes for one movie.
        theatre_id: Optional real theatre id (from get_theatres()) to
            filter to showtimes at one theatre.
        location_id: Optional real location/city id (from get_locations())
            to filter to showtimes at theatres in that city.
        date: Optional India-time calendar date, as "YYYY-MM-DD", to filter
            to showtimes on that date. The caller (agent) is responsible
            for resolving relative dates like "tonight"/"tomorrow" into
            this format using the real current India date/time it was
            given — this tool does not guess "today" itself.

    Returns:
        On success: {"status": "success", "count": int, "shows": [
            {"id", "movieId", "theatreId", "theatreName", "location",
             "startTimeIst": "YYYY-MM-DDTHH:MM:SS+05:30", "price"}, ...
        ]} sorted by start time — "shows" is an empty list (not an error)
        if none match.
        On failure: {"status": "error", "error_message": str} with a short,
        user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_SHOWTIMES_TIMEOUT_SECONDS) as client:
            shows_response, screens_response, theatres_response = await _fetch_all(client)
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching showtimes from the backend.",
        }
    except httpx.RequestError:
        return {
            "status": "error",
            "error_message": "Could not connect to the movie booking backend.",
        }

    for response, label in (
        (shows_response, "showtimes"),
        (screens_response, "screens"),
        (theatres_response, "theatres"),
    ):
        if response.status_code != 200:
            return {
                "status": "error",
                "error_message": (
                    f"The movie booking backend returned an error "
                    f"(HTTP {response.status_code}) while fetching {label}."
                ),
            }

    try:
        shows_data = shows_response.json()
        screens_data = screens_response.json()
        theatres_data = theatres_response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    shows = shows_data.get("shows") if isinstance(shows_data, dict) else None
    screens = screens_data.get("screens") if isinstance(screens_data, dict) else None
    theatres = theatres_data.get("theatres") if isinstance(theatres_data, dict) else None
    if not isinstance(shows, list) or not isinstance(screens, list) or not isinstance(theatres, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    screen_to_theatre = {
        screen.get("id"): screen.get("theatreId") for screen in screens if isinstance(screen, dict)
    }
    theatres_by_id = {
        theatre.get("id"): theatre for theatre in theatres if isinstance(theatre, dict)
    }

    results = []
    for show in shows:
        if not isinstance(show, dict):
            continue
        if movie_id and show.get("movieId") != movie_id:
            continue

        theatre_id_for_show = screen_to_theatre.get(show.get("screenId"))
        if theatre_id_for_show is None:
            continue
        if theatre_id and theatre_id_for_show != theatre_id:
            continue

        theatre = theatres_by_id.get(theatre_id_for_show)
        if theatre is None:
            continue
        if location_id and theatre.get("locationId") != location_id:
            continue

        start_time_ist = _to_india_time(show.get("startTime"))
        if start_time_ist is None:
            continue
        if date and start_time_ist.date().isoformat() != date:
            continue

        row = {field: show.get(field) for field in _SHOW_FIELDS}
        row["theatreId"] = theatre_id_for_show
        row["theatreName"] = theatre.get("name")
        row["location"] = theatre.get("location")
        row["startTimeIst"] = start_time_ist.isoformat()
        del row["screenId"]
        results.append((start_time_ist, row))

    results.sort(key=lambda pair: pair[0])
    simplified = [row for _, row in results]

    return {"status": "success", "count": len(simplified), "shows": simplified}


async def _fetch_all(client: httpx.AsyncClient):
    return await asyncio.gather(
        client.get(f"{BACKEND_BASE_URL}/api/shows"),
        client.get(f"{BACKEND_BASE_URL}/api/shows/screens"),
        client.get(f"{BACKEND_BASE_URL}/api/theatres"),
    )


def _to_india_time(raw_start_time: Optional[str]) -> Optional[datetime]:
    if not isinstance(raw_start_time, str):
        return None
    try:
        utc_dt = datetime.fromisoformat(raw_start_time.replace("Z", "+00:00"))
    except ValueError:
        return None
    return utc_dt.astimezone(INDIA_TZ)
