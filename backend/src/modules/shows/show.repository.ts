import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateScreenInput, CreateShowInput, Screen, Show } from "./show.model";

const screens = new Map<string, Screen>();
const shows = new Map<string, Show>();

export async function findScreenById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, theatre_id AS "theatreId", name, total_seats AS "totalSeats", created_at AS "createdAt", updated_at AS "updatedAt" FROM screens WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Screen | undefined;
  }
  return screens.get(id);
}

export async function findShowById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, movie_id AS "movieId", screen_id AS "screenId", start_time AS "startTime", created_at AS "createdAt", updated_at AS "updatedAt" FROM shows WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Show | undefined;
  }
  return shows.get(id);
}

export async function saveScreen(input: CreateScreenInput) {
  const now = new Date();
  const screen: Screen = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO screens (id, theatre_id, name, total_seats, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [screen.id, screen.theatreId, screen.name, screen.totalSeats, screen.createdAt, screen.updatedAt],
    );
    return screen;
  }
  screens.set(screen.id, screen);
  return screen;
}

export async function saveShow(input: CreateShowInput) {
  const now = new Date();
  const show: Show = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO shows (id, movie_id, screen_id, start_time, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [show.id, show.movieId, show.screenId, show.startTime, show.createdAt, show.updatedAt],
    );
    return show;
  }
  shows.set(show.id, show);
  return show;
}

export async function listScreens() {
  return Array.from(screens.values());
}

export async function listShows() {
  return Array.from(shows.values());
}

export async function clearShowsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM shows");
    await pool.query("DELETE FROM screens");
    return;
  }
  shows.clear();
  screens.clear();
}
