import { ApiError } from "../../shared/utils/api-error";
import { findMovieById } from "../movies/movie.repository";
import { findUserById } from "../users/user.repository";
import {
  findNamedEntityById,
  listMovieCast,
  listMovieGenres,
  listNamedEntities,
  listUserPreferences,
  listWatchHistory,
  saveMovieCast,
  saveMovieGenre,
  saveNamedEntity,
  saveUserPreference,
  saveWatchHistory,
} from "./catalog.repository";

type EntityType = "languages" | "genres" | "actors";

export function getNamedEntities(entityType: EntityType) {
  return listNamedEntities(entityType);
}

export function createNamedEntity(entityType: EntityType, payload: unknown) {
  const name = readRequiredString(readRecord(payload), "name");
  return saveNamedEntity(entityType, name);
}

export async function addMovieGenre(movieId: string, payload: unknown) {
  const body = readRecord(payload);
  const [movie, genre] = await Promise.all([
    findMovieById(movieId),
    findNamedEntityById("genres", readRequiredString(body, "genreId")),
  ]);
  if (!movie) throw new ApiError(404, "Movie not found");
  if (!genre) throw new ApiError(404, "Genre not found");
  return saveMovieGenre(movieId, genre.id);
}

export function getMovieGenres(movieId: string) {
  return listMovieGenres(movieId);
}

export async function addMovieCast(movieId: string, payload: unknown) {
  const body = readRecord(payload);
  const actorId = readRequiredString(body, "actorId");
  const roleName = readOptionalString(body, "roleName");
  const [movie, actor] = await Promise.all([
    findMovieById(movieId),
    findNamedEntityById("actors", actorId),
  ]);
  if (!movie) throw new ApiError(404, "Movie not found");
  if (!actor) throw new ApiError(404, "Actor not found");
  return saveMovieCast(movieId, actorId, roleName);
}

export function getMovieCast(movieId: string) {
  return listMovieCast(movieId);
}

export async function addUserPreference(userId: string, payload: unknown) {
  const body = readRecord(payload);
  const genreId = readOptionalString(body, "genreId");
  const languageId = readOptionalString(body, "languageId");
  if (!genreId && !languageId) {
    throw new ApiError(400, "genreId or languageId is required");
  }
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (genreId && !(await findNamedEntityById("genres", genreId))) {
    throw new ApiError(404, "Genre not found");
  }
  if (languageId && !(await findNamedEntityById("languages", languageId))) {
    throw new ApiError(404, "Language not found");
  }
  return saveUserPreference(userId, genreId, languageId);
}

export function getUserPreferences(userId: string) {
  return listUserPreferences(userId);
}

export async function addWatchHistory(userId: string, payload: unknown) {
  const body = readRecord(payload);
  const movieId = readRequiredString(body, "movieId");
  const [user, movie] = await Promise.all([findUserById(userId), findMovieById(movieId)]);
  if (!user) throw new ApiError(404, "User not found");
  if (!movie) throw new ApiError(404, "Movie not found");
  return saveWatchHistory(userId, movieId);
}

export function getWatchHistory(userId: string) {
  return listWatchHistory(userId);
}

function readRecord(payload: unknown) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  return payload as Record<string, unknown>;
}

function readRequiredString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readOptionalString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
