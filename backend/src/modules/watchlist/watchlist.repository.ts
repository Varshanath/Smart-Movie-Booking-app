import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { WatchlistItem } from "./watchlist.model";

const items = new Map<string, WatchlistItem>();

const SELECT_COLUMNS = `id, user_id AS "userId", movie_id AS "movieId", created_at AS "createdAt"`;

export async function listWatchlist(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as WatchlistItem[];
  }
  return Array.from(items.values()).filter((item) => item.userId === userId);
}

export async function addToWatchlist(userId: string, movieId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        INSERT INTO watchlists (id, user_id, movie_id, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, movie_id) DO UPDATE SET user_id = EXCLUDED.user_id
        RETURNING ${SELECT_COLUMNS}
      `,
      [randomUUID(), userId, movieId, new Date()],
    );
    return result.rows[0] as WatchlistItem;
  }

  const existing = Array.from(items.values()).find(
    (item) => item.userId === userId && item.movieId === movieId,
  );
  if (existing) return existing;

  const item: WatchlistItem = { id: randomUUID(), userId, movieId, createdAt: new Date() };
  items.set(item.id, item);
  return item;
}

export async function removeFromWatchlist(userId: string, movieId: string) {
  if (isPostgresEnabled && pool) {
    await pool.query(`DELETE FROM watchlists WHERE user_id = $1 AND movie_id = $2`, [userId, movieId]);
    return;
  }

  const existing = Array.from(items.entries()).find(
    ([, item]) => item.userId === userId && item.movieId === movieId,
  );
  if (existing) items.delete(existing[0]);
}

export async function clearWatchlistsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM watchlists");
    return;
  }
  items.clear();
}
