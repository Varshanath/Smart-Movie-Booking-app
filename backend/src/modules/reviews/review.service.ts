import { ApiError } from "../../shared/utils/api-error";
import { findMovieById } from "../movies/movie.repository";
import { findUserById } from "../users/user.repository";
import { CreateReviewInput } from "./review.model";
import { listReviewsByMovieId, listReviewsByUserId, saveReview } from "./review.repository";

export function getMovieReviews(movieId: string) {
  return listReviewsByMovieId(movieId);
}

export function getUserReviews(userId: string) {
  return listReviewsByUserId(userId);
}

export async function addMovieReview(movieId: string, payload: unknown) {
  const body = readRecord(payload);
  const userId = readRequiredString(body, "userId");
  const rating = readRating(body);
  const reviewText = readRequiredString(body, "reviewText");

  const [user, movie] = await Promise.all([findUserById(userId), findMovieById(movieId)]);
  if (!user) throw new ApiError(404, "User not found");
  if (!movie) throw new ApiError(404, "Movie not found");

  const input: CreateReviewInput = { userId, movieId, rating, reviewText };
  return saveReview(input);
}

function readRating(body: Record<string, unknown>): number {
  const value = body.rating;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new ApiError(400, "rating must be a number between 0 and 5");
  }
  return value;
}

function readRequiredString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function readRecord(payload: unknown) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new ApiError(400, "Request body is required");
  }
  return payload as Record<string, unknown>;
}
