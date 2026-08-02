import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.showtime_tools import get_showtimes

SHOWS_URL = f"{BACKEND_BASE_URL}/api/shows"
SCREENS_URL = f"{BACKEND_BASE_URL}/api/shows/screens"
THEATRES_URL = f"{BACKEND_BASE_URL}/api/theatres"

SHOWS = [
    {"id": "show-1", "movieId": "m1", "screenId": "s1", "startTime": "2026-08-03T04:00:00.000Z", "price": 250},
    {"id": "show-2", "movieId": "m1", "screenId": "s2", "startTime": "2026-08-03T13:00:00.000Z", "price": 300},
    {"id": "show-3", "movieId": "m2", "screenId": "s1", "startTime": "2026-08-04T04:00:00.000Z", "price": 200},
    {"id": "show-4", "movieId": "m1", "screenId": "s3", "startTime": "2026-08-03T04:00:00.000Z", "price": 280},
]
SCREENS = [
    {"id": "s1", "theatreId": "t1", "name": "Screen 1"},
    {"id": "s2", "theatreId": "t2", "name": "Screen 1"},
    {"id": "s3", "theatreId": "t3", "name": "Screen 1"},
]
THEATRES = [
    {"id": "t1", "name": "PVR Quest", "location": "Kolkata", "locationId": "loc-kolkata", "totalSeats": 960},
    {"id": "t2", "name": "INOX South City", "location": "Kolkata", "locationId": "loc-kolkata", "totalSeats": 960},
    {"id": "t3", "name": "PVR Select", "location": "Delhi", "locationId": "loc-delhi", "totalSeats": 960},
]


def mock_backend(shows=SHOWS, screens=SCREENS, theatres=THEATRES, shows_status=200, screens_status=200, theatres_status=200):
    respx.get(SHOWS_URL).mock(return_value=httpx.Response(shows_status, json={"shows": shows}))
    respx.get(SCREENS_URL).mock(return_value=httpx.Response(screens_status, json={"screens": screens}))
    respx.get(THEATRES_URL).mock(return_value=httpx.Response(theatres_status, json={"theatres": theatres}))


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_successful_retrieval_joins_and_converts_to_ist():
    mock_backend()

    result = await get_showtimes()

    assert result["status"] == "success"
    assert result["count"] == 4
    show1 = next(s for s in result["shows"] if s["id"] == "show-1")
    assert show1 == {
        "id": "show-1",
        "movieId": "m1",
        "startTime": "2026-08-03T04:00:00.000Z",
        "price": 250,
        "theatreId": "t1",
        "theatreName": "PVR Quest",
        "location": "Kolkata",
        "startTimeIst": "2026-08-03T09:30:00+05:30",
    }
    assert "screenId" not in show1


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_filters_by_movie_id():
    mock_backend()

    result = await get_showtimes(movie_id="m2")

    assert result["status"] == "success"
    assert result["count"] == 1
    assert result["shows"][0]["id"] == "show-3"


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_filters_by_theatre_id():
    mock_backend()

    result = await get_showtimes(theatre_id="t1")

    assert result["status"] == "success"
    assert {s["id"] for s in result["shows"]} == {"show-1", "show-3"}


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_filters_by_location_id():
    mock_backend()

    result = await get_showtimes(location_id="loc-delhi")

    assert result["status"] == "success"
    assert result["count"] == 1
    assert result["shows"][0]["id"] == "show-4"


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_filters_by_date_in_india_time():
    mock_backend()

    result = await get_showtimes(date="2026-08-04")

    assert result["status"] == "success"
    assert result["count"] == 1
    assert result["shows"][0]["id"] == "show-3"


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_combined_filters():
    mock_backend()

    result = await get_showtimes(movie_id="m1", location_id="loc-kolkata", date="2026-08-03")

    assert result["status"] == "success"
    assert {s["id"] for s in result["shows"]} == {"show-1", "show-2"}


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_empty_results_is_success_not_error():
    mock_backend()

    result = await get_showtimes(movie_id="does-not-exist")

    assert result == {"status": "success", "count": 0, "shows": []}


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_backend_http_error():
    mock_backend(shows_status=500)

    result = await get_showtimes()

    assert result["status"] == "error"
    assert "500" in result["error_message"]


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_timeout():
    respx.get(SHOWS_URL).mock(side_effect=httpx.TimeoutException("timed out"))
    respx.get(SCREENS_URL).mock(return_value=httpx.Response(200, json={"screens": SCREENS}))
    respx.get(THEATRES_URL).mock(return_value=httpx.Response(200, json={"theatres": THEATRES}))

    result = await get_showtimes()

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching showtimes from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_connection_error():
    respx.get(SHOWS_URL).mock(side_effect=httpx.ConnectError("connection refused"))
    respx.get(SCREENS_URL).mock(return_value=httpx.Response(200, json={"screens": SCREENS}))
    respx.get(THEATRES_URL).mock(return_value=httpx.Response(200, json={"theatres": THEATRES}))

    result = await get_showtimes()

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_showtimes_invalid_json_response():
    respx.get(SHOWS_URL).mock(
        return_value=httpx.Response(200, content=b"not json", headers={"content-type": "application/json"})
    )
    respx.get(SCREENS_URL).mock(return_value=httpx.Response(200, json={"screens": SCREENS}))
    respx.get(THEATRES_URL).mock(return_value=httpx.Response(200, json={"theatres": THEATRES}))

    result = await get_showtimes()

    assert result["status"] == "error"
