import re

import httpx

from ..config import BACKEND_BASE_URL

GET_SEAT_AVAILABILITY_TIMEOUT_SECONDS = 10.0

# GET /api/shows/:showId/seats (backend/src/modules/shows/show.service.ts,
# getShowSeatMap) is genuinely show-specific: it computes seatLabels
# arithmetically from the show's screen (rows x seatsPerRow) and separately
# cross-references bookedSeats from REAL confirmed bookings for that exact
# showId (backend/src/modules/bookings/booking.repository.ts,
# listBookingsByShowId, filtered to status === "confirmed"). So a seat's
# available/occupied state genuinely reflects that show's current booking
# state — this is not a static per-screen map.
#
# Deliberately NOT used/joined: GET /api/shows/screens/:screenId/seats
# returns the screen's real seat inventory (id, rowLabel, seatNumber,
# seatType e.g. Regular/Premium/Recliner) — but it has no booking status,
# is not show-specific, and getShowSeatMap's response doesn't even return
# a screenId to join it against. Matching its rowLabel+seatNumber rows
# against this endpoint's generated "A1"-style labels would rely on an
# unguaranteed assumption that the two numbering schemes line up — an
# invented relationship, not something the API actually establishes. So
# seat categories/types are NOT available in this tool's output; see the
# docstring below.
_LABEL_PATTERN = re.compile(r"^([A-Za-z]+)(\d+)$")


async def get_seat_availability(show_id: str) -> dict:
    """Retrieves real, show-specific seat availability for one exact show.

    Call this only when the user asks about seat availability, which seats
    are free, or seat selection options for a SPECIFIC show — not for
    generic movie/showtime questions. You must already have a real show_id
    (e.g. from get_showtimes()) before calling this; never guess one.

    The backend has exactly two seat states here: "available" and
    "occupied" (booked). There is no third state (e.g. "blocked" or
    "unknown") in the current data — a seat is "occupied" only if it
    appears in a real confirmed booking for this exact show, otherwise it
    is "available". Seat categories/types (Regular/Premium/Recliner) are
    NOT included — the backend's show-seat endpoint doesn't expose them
    (see the module-level comment for why they aren't safely joinable
    here). Price is a single per-show value, not per-seat/per-category.

    Args:
        show_id: The real show id to check (from get_showtimes()).

    Returns:
        On success: {"status": "success", "show_id": str, "price":
            number | None, "count": int, "available_count": int,
            "occupied_count": int, "seats": [
                {"label": str, "row": str, "number": int, "status":
                 "available" | "occupied"}, ...
            ]} — "seats" covers every seat on the show's screen; filter to
            status == "available" yourself when presenting options.
        If show_id doesn't match any real show: {"status": "not_found",
            "error_message": str}.
        On other failure: {"status": "error", "error_message": str} with a
        short, user-safe message (no stack traces or internal details).
    """
    try:
        async with httpx.AsyncClient(timeout=GET_SEAT_AVAILABILITY_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{BACKEND_BASE_URL}/api/shows/{show_id}/seats")
    except httpx.TimeoutException:
        return {
            "status": "error",
            "error_message": "Timed out while fetching seat availability from the backend.",
        }
    except httpx.RequestError:
        return {
            "status": "error",
            "error_message": "Could not connect to the movie booking backend.",
        }

    if response.status_code == 404:
        return {"status": "not_found", "error_message": "That show could not be found."}

    if response.status_code != 200:
        return {
            "status": "error",
            "error_message": (
                f"The movie booking backend returned an error "
                f"(HTTP {response.status_code}) while fetching seat availability."
            ),
        }

    try:
        data = response.json()
    except ValueError:
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an invalid response.",
        }

    seat_map = data.get("seatMap") if isinstance(data, dict) else None
    if not isinstance(seat_map, dict):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    seat_labels = seat_map.get("seatLabels")
    booked_seats = seat_map.get("bookedSeats")
    if not isinstance(seat_labels, list) or not isinstance(booked_seats, list):
        return {
            "status": "error",
            "error_message": "The movie booking backend returned an unexpected response.",
        }

    booked_set = set(booked_seats)
    seats = []
    available_count = 0
    occupied_count = 0
    for label in seat_labels:
        if not isinstance(label, str):
            continue
        match = _LABEL_PATTERN.match(label)
        row, number = (match.group(1), int(match.group(2))) if match else (None, None)
        is_occupied = label in booked_set
        if is_occupied:
            occupied_count += 1
        else:
            available_count += 1
        seats.append(
            {
                "label": label,
                "row": row,
                "number": number,
                "status": "occupied" if is_occupied else "available",
            }
        )

    return {
        "status": "success",
        "show_id": seat_map.get("showId", show_id),
        "price": seat_map.get("price"),
        "count": len(seats),
        "available_count": available_count,
        "occupied_count": occupied_count,
        "seats": seats,
    }
