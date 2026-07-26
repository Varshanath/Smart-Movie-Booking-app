import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import {
  MovieCastLink,
  MovieGenreLink,
  NamedEntity,
  UserPreference,
  WatchHistory,
} from "./catalog.model";

type EntityType = "languages" | "genres" | "actors";

const languages = new Map<string, NamedEntity>();
const genres = new Map<string, NamedEntity>();
const actors = new Map<string, NamedEntity>();
const movieGenres: MovieGenreLink[] = [];
const movieCast: MovieCastLink[] = [];
const userPreferences = new Map<string, UserPreference>();
const watchHistory = new Map<string, WatchHistory>();

function storeFor(entityType: EntityType) {
  if (entityType === "languages") return languages;
  if (entityType === "genres") return genres;
  return actors;
}

export async function listNamedEntities(entityType: EntityType) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`SELECT id, name FROM ${entityType} ORDER BY name`);
    return result.rows as NamedEntity[];
  }
  return Array.from(storeFor(entityType).values());
}

export async function findNamedEntityById(entityType: EntityType, id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`SELECT id, name FROM ${entityType} WHERE id = $1`, [id]);
    return result.rows[0] as NamedEntity | undefined;
  }
  return storeFor(entityType).get(id);
}

export async function saveNamedEntity(entityType: EntityType, name: string) {
  const entity = { id: randomUUID(), name };
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `INSERT INTO ${entityType} (id, name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
      [entity.id, entity.name],
    );
    return result.rows[0] as NamedEntity;
  }
  const existing = Array.from(storeFor(entityType).values()).find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing;
  storeFor(entityType).set(entity.id, entity);
  return entity;
}

export async function saveMovieGenre(movieId: string, genreId: string) {
  if (isPostgresEnabled && pool) {
    await pool.query(
      "INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [movieId, genreId],
    );
  } else if (!movieGenres.some((item) => item.movieId === movieId && item.genreId === genreId)) {
    movieGenres.push({ movieId, genreId });
  }
  return { movieId, genreId };
}

export async function listMovieGenreLinks() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT movie_id AS "movieId", genre_id AS "genreId" FROM movie_genres`,
    );
    return result.rows as MovieGenreLink[];
  }
  return [...movieGenres];
}

export async function listMovieGenres(movieId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT g.id, g.name FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id WHERE mg.movie_id = $1 ORDER BY g.name`,
      [movieId],
    );
    return result.rows as NamedEntity[];
  }
  return movieGenres
    .filter((item) => item.movieId === movieId)
    .map((item) => genres.get(item.genreId))
    .filter((item): item is NamedEntity => Boolean(item));
}

export async function saveMovieCast(movieId: string, actorId: string, roleName?: string) {
  if (isPostgresEnabled && pool) {
    await pool.query(
      "INSERT INTO movie_cast (movie_id, actor_id, role_name) VALUES ($1, $2, $3) ON CONFLICT (movie_id, actor_id) DO UPDATE SET role_name = EXCLUDED.role_name",
      [movieId, actorId, roleName],
    );
  } else if (!movieCast.some((item) => item.movieId === movieId && item.actorId === actorId)) {
    movieCast.push({ movieId, actorId, roleName });
  }
  return { movieId, actorId, roleName };
}

export async function listMovieCast(movieId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT a.id, a.name, mc.role_name AS "roleName" FROM movie_cast mc JOIN actors a ON a.id = mc.actor_id WHERE mc.movie_id = $1 ORDER BY a.name`,
      [movieId],
    );
    return result.rows;
  }
  return movieCast
    .filter((item) => item.movieId === movieId)
    .map((item) => ({ ...actors.get(item.actorId), roleName: item.roleName }))
    .filter((item) => Boolean(item.id));
}

export async function saveUserPreference(userId: string, genreId?: string, languageId?: string) {
  const preference = { id: randomUUID(), userId, genreId, languageId, createdAt: new Date() };
  if (isPostgresEnabled && pool) {
    await pool.query(
      "INSERT INTO user_preferences (id, user_id, genre_id, language_id, created_at) VALUES ($1, $2, $3, $4, $5)",
      [preference.id, userId, genreId, languageId, preference.createdAt],
    );
  } else {
    userPreferences.set(preference.id, preference);
  }
  return preference;
}

export async function listUserPreferences(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, user_id AS "userId", genre_id AS "genreId", language_id AS "languageId", created_at AS "createdAt" FROM user_preferences WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as UserPreference[];
  }
  return Array.from(userPreferences.values()).filter((item) => item.userId === userId);
}

export async function saveWatchHistory(userId: string, movieId: string) {
  const history = { id: randomUUID(), userId, movieId, watchedAt: new Date() };
  if (isPostgresEnabled && pool) {
    await pool.query(
      "INSERT INTO watch_history (id, user_id, movie_id, watched_at) VALUES ($1, $2, $3, $4)",
      [history.id, userId, movieId, history.watchedAt],
    );
  } else {
    watchHistory.set(history.id, history);
  }
  return history;
}

export async function listWatchHistory(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, user_id AS "userId", movie_id AS "movieId", watched_at AS "watchedAt" FROM watch_history WHERE user_id = $1 ORDER BY watched_at DESC`,
      [userId],
    );
    return result.rows as WatchHistory[];
  }
  return Array.from(watchHistory.values()).filter((item) => item.userId === userId);
}

export async function clearCatalogForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM watch_history");
    await pool.query("DELETE FROM user_preferences");
    await pool.query("DELETE FROM movie_cast");
    await pool.query("DELETE FROM movie_genres");
    await pool.query("DELETE FROM actors");
    await pool.query("DELETE FROM genres");
    await pool.query("DELETE FROM languages");
    return;
  }
  languages.clear();
  genres.clear();
  actors.clear();
  movieGenres.length = 0;
  movieCast.length = 0;
  userPreferences.clear();
  watchHistory.clear();
}
