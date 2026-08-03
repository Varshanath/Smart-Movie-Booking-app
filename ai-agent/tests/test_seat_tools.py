import httpx
import pytest
import respx

from app.config import BACKEND_BASE_URL
from app.tools.seat_tools import get_seat_availability

SHOW_ID = "show-1"
SEATS_URL = f"{BACKEND_BASE_URL}/api/shows/{SHOW_ID}/seats"


def seat_map(rows=2, seats_per_row=3, price=250, seat_labels=None, booked_seats=None):
    return {
        "seatMap": {
            "showId": SHOW_ID,
            "rows": rows,
            "seatsPerRow": seats_per_row,
            "price": price,
            "seatLabels": seat_labels if seat_labels is not None else ["A1", "A2", "A3", "B1", "B2", "B3"],
            "bookedSeats": booked_seats if booked_seats is not None else [],
        }
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_successful_retrieval():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(200, json=seat_map(booked_seats=["A2"])))

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "success"
    assert result["show_id"] == SHOW_ID
    assert result["price"] == 250
    assert result["count"] == 6
    assert result["available_count"] == 5
    assert result["occupied_count"] == 1
    a2 = next(s for s in result["seats"] if s["label"] == "A2")
    assert a2 == {"label": "A2", "row": "A", "number": 2, "status": "occupied"}
    a1 = next(s for s in result["seats"] if s["label"] == "A1")
    assert a1 == {"label": "A1", "row": "A", "number": 1, "status": "available"}


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_all_seats_available():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(200, json=seat_map(booked_seats=[])))

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "success"
    assert result["available_count"] == 6
    assert result["occupied_count"] == 0
    assert all(s["status"] == "available" for s in result["seats"])


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_some_seats_occupied():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(200, json=seat_map(booked_seats=["A1", "B2"])))

    result = await get_seat_availability(SHOW_ID)

    occupied_labels = {s["label"] for s in result["seats"] if s["status"] == "occupied"}
    assert occupied_labels == {"A1", "B2"}
    assert result["available_count"] == 4
    assert result["occupied_count"] == 2


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_no_available_seats():
    all_labels = ["A1", "A2", "A3", "B1", "B2", "B3"]
    respx.get(SEATS_URL).mock(return_value=httpx.Response(200, json=seat_map(booked_seats=all_labels)))

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "success"
    assert result["available_count"] == 0
    assert result["occupied_count"] == 6
    assert all(s["status"] == "occupied" for s in result["seats"])


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_empty_seat_labels_is_success_not_error():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(200, json=seat_map(seat_labels=[], booked_seats=[])))

    result = await get_seat_availability(SHOW_ID)

    assert result == {
        "status": "success",
        "show_id": SHOW_ID,
        "price": 250,
        "count": 0,
        "available_count": 0,
        "occupied_count": 0,
        "seats": [],
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_backend_http_error():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(500, json={"message": "Internal server error"}))

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "error"
    assert "500" in result["error_message"]
    assert "Internal server error" not in result["error_message"]


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_timeout():
    respx.get(SEATS_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await get_seat_availability(SHOW_ID)

    assert result == {
        "status": "error",
        "error_message": "Timed out while fetching seat availability from the backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_connection_error():
    respx.get(SEATS_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    result = await get_seat_availability(SHOW_ID)

    assert result == {
        "status": "error",
        "error_message": "Could not connect to the movie booking backend.",
    }


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_invalid_json_response():
    respx.get(SEATS_URL).mock(
        return_value=httpx.Response(200, content=b"not json", headers={"content-type": "application/json"})
    )

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "error"


@pytest.mark.asyncio
@respx.mock
async def test_get_seat_availability_unknown_show_returns_not_found():
    respx.get(SEATS_URL).mock(return_value=httpx.Response(404, json={"message": "Show not found"}))

    result = await get_seat_availability(SHOW_ID)

    assert result["status"] == "not_found"
    assert "Show not found" not in result["error_message"]
