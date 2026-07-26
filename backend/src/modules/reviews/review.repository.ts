import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateReviewInput, Review } from "./review.model";

const reviews = new Map<string, Review>();

const SELECT_COLUMNS = `
  id,
  user_id AS "userId",
  movie_id AS "movieId",
  rating,
  review_text AS "reviewText",
  created_at AS "createdAt"
`;

export async function listReviewsByMovieId(movieId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM reviews WHERE movie_id = $1 ORDER BY created_at DESC`,
      [movieId],
    );
    return result.rows as Review[];
  }
  return Array.from(reviews.values()).filter((review) => review.movieId === movieId);
}

export async function listReviewsByUserId(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as Review[];
  }
  return Array.from(reviews.values()).filter((review) => review.userId === userId);
}

export async function saveReview(input: CreateReviewInput) {
  const review: Review = { id: randomUUID(), ...input, createdAt: new Date() };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO reviews (id, user_id, movie_id, rating, review_text, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [review.id, review.userId, review.movieId, review.rating, review.reviewText, review.createdAt],
    );
    return review;
  }

  reviews.set(review.id, review);
  return review;
}

export async function clearReviewsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM reviews");
    return;
  }
  reviews.clear();
}
