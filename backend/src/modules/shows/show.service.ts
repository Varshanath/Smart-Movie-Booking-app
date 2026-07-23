import { listBookingsByShowId } from "../bookings/booking.repository";
import { ApiError } from "../../shared/utils/api-error";
import { findMovieById } from "../movies/movie.repository";
import { findTheatreById } from "../theatres/theatre.repository";
import { CreateScreenInput, CreateShowInput, ShowSeatMap } from "./show.model";
import {
  findScreenById,
  findShowById,
  listScreens,
  listShows,
  saveScreen,
  saveShow,
} from "./show.repository";

export async function getScreens() {
  return listScreens();
}

export async function getShows() {
  return listShows();
}

export async function createScreen(payload: unknown) {
  const input = validateCreateScreenInput(payload);
  const theatre = await findTheatreById(input.theatreId);
  if (!theatre) {
    throw new ApiError(404, "Theatre not found");
  }
  return saveScreen(input);
}

export async function createShow(payload: unknown) {
  const input = validateCreateShowInput(payload);
  const [movie, screen] = await Promise.all([
    findMovieById(input.movieId),
    findScreenById(input.screenId),
  ]);
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }
  if (!screen) {
    throw new ApiError(404, "Screen not found");
  }
  return saveShow(input);
}

export async function getShowSeatMap(showId: string): Promise<ShowSeatMap> {
  const show = await findShowById(showId);
  if (!show) {
    throw new ApiError(404, "Show not found");
  }

  const screen = await findScreenById(show.screenId);
  if (!screen) {
    throw new ApiError(404, "Screen not found");
  }

  const bookings = await listBookingsByShowId(showId);
  const bookedSeats = bookings
    .filter((booking) => booking.status === "confirmed")
    .flatMap((booking) => booking.seatNumbers);

  return {
    showId: show.id,
    rows: screen.rows,
    seatsPerRow: screen.seatsPerRow,
    price: show.price,
    seatLabels: generateSeatLabels(screen.rows, screen.seatsPerRow),
    bookedSeats,
  };
}

export function generateSeatLabels(rows: number, seatsPerRow: number): string[] {
  const labels: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    const rowLetter = String.fromCharCode(65 + row);
    for (let seat = 1; seat <= seatsPerRow; seat += 1) {
      labels.push(`${rowLetter}${seat}`);
    }
  }
  return labels;
}

export function isValidSeatLabel(
  label: string,
  rows: number,
  seatsPerRow: number,
): boolean {
  const match = /^([A-Z])(\d+)$/.exec(label);
  if (!match) {
    return false;
  }
  const rowIndex = match[1].charCodeAt(0) - 65;
  const seatNumber = Number(match[2]);
  return rowIndex >= 0 && rowIndex < rows && seatNumber >= 1 && seatNumber <= seatsPerRow;
}

function validateCreateScreenInput(payload: unknown): CreateScreenInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  return {
    theatreId: readRequiredString(payload, "theatreId"),
    name: readRequiredString(payload, "name"),
    rows: readPositiveNumber(payload, "rows"),
    seatsPerRow: readPositiveNumber(payload, "seatsPerRow"),
  };
}

function validateCreateShowInput(payload: unknown): CreateShowInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  return {
    movieId: readRequiredString(payload, "movieId"),
    screenId: readRequiredString(payload, "screenId"),
    startTime: readRequiredString(payload, "startTime"),
    price: readPositiveNumber(payload, "price"),
  };
}

function readRequiredString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readPositiveNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new ApiError(400, `${key} must be a positive number`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
