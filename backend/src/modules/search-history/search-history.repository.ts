import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { SearchHistoryEntry } from "./search-history.model";

const entries = new Map<string, SearchHistoryEntry>();

const SELECT_COLUMNS = `id, user_id AS "userId", query, created_at AS "createdAt"`;

export async function listSearchHistory(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM search_history WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as SearchHistoryEntry[];
  }
  return Array.from(entries.values())
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function saveSearchHistoryEntry(userId: string, query: string) {
  const entry: SearchHistoryEntry = { id: randomUUID(), userId, query, createdAt: new Date() };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `INSERT INTO search_history (id, user_id, query, created_at) VALUES ($1, $2, $3, $4)`,
      [entry.id, entry.userId, entry.query, entry.createdAt],
    );
    return entry;
  }

  entries.set(entry.id, entry);
  return entry;
}

export async function clearSearchHistoryForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM search_history");
    return;
  }
  entries.clear();
}
