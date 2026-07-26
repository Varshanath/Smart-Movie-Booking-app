import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { Location } from "./location.model";

const locations = new Map<string, Location>();

export async function listLocations() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM locations
      ORDER BY name
    `);
    return result.rows as Location[];
  }

  return Array.from(locations.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function findLocationById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt" FROM locations WHERE id = $1`,
      [id],
    );
    return result.rows[0] as Location | undefined;
  }

  return locations.get(id);
}

export async function findOrCreateLocationByName(name: string) {
  const trimmed = name.trim();

  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        INSERT INTO locations (id, name)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [randomUUID(), trimmed],
    );
    return result.rows[0] as Location;
  }

  const existing = Array.from(locations.values()).find(
    (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  const now = new Date();
  const location: Location = { id: randomUUID(), name: trimmed, createdAt: now, updatedAt: now };
  locations.set(location.id, location);
  return location;
}

export async function clearLocationsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM locations");
    return;
  }

  locations.clear();
}
