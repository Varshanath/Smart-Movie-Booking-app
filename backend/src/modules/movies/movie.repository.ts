import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateMovieInput, Movie } from "./movie.model";

const movies = new Map<string, Movie>();

export async function listMovies() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT
        id,
        title,
        genre,
        language,
        duration_minutes AS "durationMinutes",
        release_date AS "releaseDate",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM movies
      ORDER BY created_at DESC
    `);
    return result.rows as Movie[];
  }

  return Array.from(movies.values());
}

export async function findMovieById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          id,
          title,
          genre,
          language,
          duration_minutes AS "durationMinutes",
          release_date AS "releaseDate",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM movies
        WHERE id = $1
      `,
      [id],
    );
    return result.rows[0] as Movie | undefined;
  }

  return movies.get(id);
}

export async function saveMovie(input: CreateMovieInput) {
  const now = new Date();
  const movie: Movie = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO movies (
          id, title, genre, language, duration_minutes, release_date, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        movie.id,
        movie.title,
        movie.genre,
        movie.language,
        movie.durationMinutes,
        movie.releaseDate,
        movie.createdAt,
        movie.updatedAt,
      ],
    );
    return movie;
  }

  movies.set(movie.id, movie);
  return movie;
}

export async function clearMoviesForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM movies");
    return;
  }

  movies.clear();
}
