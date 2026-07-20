import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { CreateTheatreInput, Theatre } from "./theatre.model";

const theatres = new Map<string, Theatre>();

export async function listTheatres() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT
        id,
        name,
        location,
        total_seats AS "totalSeats",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM theatres
      ORDER BY created_at DESC
    `);
    return result.rows as Theatre[];
  }

  return Array.from(theatres.values());
}

export async function findTheatreById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          location,
          total_seats AS "totalSeats",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM theatres
        WHERE id = $1
      `,
      [id],
    );
    return result.rows[0] as Theatre | undefined;
  }

  return theatres.get(id);
}

export async function saveTheatre(input: CreateTheatreInput) {
  const now = new Date();
  const theatre: Theatre = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO theatres (id, name, location, total_seats, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        theatre.id,
        theatre.name,
        theatre.location,
        theatre.totalSeats,
        theatre.createdAt,
        theatre.updatedAt,
      ],
    );
    return theatre;
  }

  theatres.set(theatre.id, theatre);
  return theatre;
}

export async function clearTheatresForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM theatres");
    return;
  }

  theatres.clear();
}
