import { ApiError } from "../../shared/utils/api-error";
import { CreateMovieInput } from "./movie.model";
import { listMovies, saveMovie } from "./movie.repository";

export async function getMovies() {
  return listMovies();
}

export async function createMovie(payload: unknown) {
  return saveMovie(validateCreateMovieInput(payload));
}

function validateCreateMovieInput(payload: unknown): CreateMovieInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }

  return {
    title: readRequiredString(payload, "title"),
    genre: readRequiredString(payload, "genre"),
    language: readRequiredString(payload, "language"),
    durationMinutes: readPositiveNumber(payload, "durationMinutes"),
    releaseDate: readRequiredString(payload, "releaseDate"),
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
