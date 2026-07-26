import { ApiError } from "../../shared/utils/api-error";
import { findMovieById } from "../movies/movie.repository";
import { findUserById } from "../users/user.repository";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "./watchlist.repository";

export function getWatchlist(userId: string) {
  return listWatchlist(userId);
}

export async function addWatchlistItem(userId: string, payload: unknown) {
  const movieId = readMovieId(payload);
  const [user, movie] = await Promise.all([findUserById(userId), findMovieById(movieId)]);
  if (!user) throw new ApiError(404, "User not found");
  if (!movie) throw new ApiError(404, "Movie not found");
  return addToWatchlist(userId, movieId);
}

export async function removeWatchlistItem(userId: string, movieId: string) {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(404, "User not found");
  await removeFromWatchlist(userId, movieId);
}

function readMovieId(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  const value = (payload as Record<string, unknown>).movieId;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "movieId is required");
  }
  return value.trim();
}
