import { findMovieById } from "../movies/movie.repository";
import { findTheatreById } from "../theatres/theatre.repository";
import { findUserById } from "../users/user.repository";
import { ApiError } from "../../shared/utils/api-error";
import { CreateBookingInput } from "./booking.model";
import { listBookings, saveBooking } from "./booking.repository";

export async function getBookings() {
  return listBookings();
}

export async function createBooking(payload: unknown) {
  const input = validateCreateBookingInput(payload);

  const [user, movie, theatre] = await Promise.all([
    findUserById(input.userId),
    findMovieById(input.movieId),
    findTheatreById(input.theatreId),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!movie) {
    throw new ApiError(404, "Movie not found");
  }
  if (!theatre) {
    throw new ApiError(404, "Theatre not found");
  }

  return saveBooking(input);
}

function validateCreateBookingInput(payload: unknown): CreateBookingInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  return {
    userId: readRequiredString(payload, "userId"),
    movieId: readRequiredString(payload, "movieId"),
    theatreId: readRequiredString(payload, "theatreId"),
    showTime: readRequiredString(payload, "showTime"),
    seats: readPositiveNumber(payload, "seats"),
  };
}

function readRequiredString(
  payload: Record<string, unknown>,
  key: string,
): string {
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
