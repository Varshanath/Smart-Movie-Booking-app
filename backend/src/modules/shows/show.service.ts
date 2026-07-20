import { ApiError } from "../../shared/utils/api-error";
import { findMovieById } from "../movies/movie.repository";
import { findTheatreById } from "../theatres/theatre.repository";
import { CreateScreenInput, CreateShowInput } from "./show.model";
import { findScreenById, listScreens, listShows, saveScreen, saveShow } from "./show.repository";

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

function validateCreateScreenInput(payload: unknown): CreateScreenInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  return {
    theatreId: readRequiredString(payload, "theatreId"),
    name: readRequiredString(payload, "name"),
    totalSeats: readPositiveNumber(payload, "totalSeats"),
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
