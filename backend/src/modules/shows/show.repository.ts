import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateScreenInput, CreateShowInput, Screen, Show } from "./show.model";

const screens = new Map<string, Screen>();
const shows = new Map<string, Show>();

export async function findScreenById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, theatre_id AS "theatreId", name, rows, seats_per_row AS "seatsPerRow", total_seats AS "totalSeats", created_at AS "createdAt", updated_at AS "updatedAt" FROM screens WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Screen | undefined;
  }
  return screens.get(id);
}

export async function findShowById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, movie_id AS "movieId", screen_id AS "screenId", start_time AS "startTime", price, created_at AS "createdAt", updated_at AS "updatedAt" FROM shows WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Show | undefined;
  }
  return shows.get(id);
}

export async function saveScreen(input: CreateScreenInput) {
  const now = new Date();
  const screen: Screen = {
    id: randomUUID(),
    theatreId: input.theatreId,
    name: input.name,
    rows: input.rows,
    seatsPerRow: input.seatsPerRow,
    totalSeats: input.rows * input.seatsPerRow,
    createdAt: now,
    updatedAt: now,
  };
  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO screens (id, theatre_id, name, rows, seats_per_row, total_seats, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        screen.id,
        screen.theatreId,
        screen.name,
        screen.rows,
        screen.seatsPerRow,
        screen.totalSeats,
        screen.createdAt,
        screen.updatedAt,
      ],
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
      `INSERT INTO shows (id, movie_id, screen_id, start_time, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [show.id, show.movieId, show.screenId, show.startTime, show.price, show.createdAt, show.updatedAt],
    );
    return show;
  }
  shows.set(show.id, show);
  return show;
}

export async function listScreens() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, theatre_id AS "theatreId", name, rows, seats_per_row AS "seatsPerRow", total_seats AS "totalSeats", created_at AS "createdAt", updated_at AS "updatedAt" FROM screens ORDER BY created_at DESC`,
    );
    return result.rows as Screen[];
  }
  return Array.from(screens.values());
}

export async function listShows() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, movie_id AS "movieId", screen_id AS "screenId", start_time AS "startTime", price, created_at AS "createdAt", updated_at AS "updatedAt" FROM shows ORDER BY start_time ASC`,
    );
    return result.rows as Show[];
  }
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
