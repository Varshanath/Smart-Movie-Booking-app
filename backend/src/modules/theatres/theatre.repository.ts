import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { findLocationById, findOrCreateLocationByName } from "../locations/location.repository";
import { CreateTheatreInput, Theatre } from "./theatre.model";

interface TheatreRecord {
  id: string;
  name: string;
  locationId: string;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const theatres = new Map<string, TheatreRecord>();

export async function listTheatres() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT
        t.id,
        t.name,
        l.name AS location,
        t.location_id AS "locationId",
        t.total_seats AS "totalSeats",
        t.created_at AS "createdAt",
        t.updated_at AS "updatedAt"
      FROM theatres t
      JOIN locations l ON l.id = t.location_id
      ORDER BY t.created_at DESC
    `);
    return result.rows as Theatre[];
  }

  return Promise.all(Array.from(theatres.values()).map(toTheatre));
}

export async function findTheatreById(id: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `
        SELECT
          t.id,
          t.name,
          l.name AS location,
          t.location_id AS "locationId",
          t.total_seats AS "totalSeats",
          t.created_at AS "createdAt",
          t.updated_at AS "updatedAt"
        FROM theatres t
        JOIN locations l ON l.id = t.location_id
        WHERE t.id = $1
      `,
      [id],
    );
    return result.rows[0] as Theatre | undefined;
  }

  const record = theatres.get(id);
  return record ? toTheatre(record) : undefined;
}

export async function saveTheatre(input: CreateTheatreInput) {
  const location = await findOrCreateLocationByName(input.location);
  const now = new Date();
  const record: TheatreRecord = {
    id: randomUUID(),
    name: input.name,
    locationId: location.id,
    totalSeats: input.totalSeats,
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO theatres (id, name, location_id, total_seats, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [record.id, record.name, record.locationId, record.totalSeats, record.createdAt, record.updatedAt],
    );
  } else {
    theatres.set(record.id, record);
  }

  return {
    id: record.id,
    name: record.name,
    location: location.name,
    locationId: location.id,
    totalSeats: record.totalSeats,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function clearTheatresForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM theatres");
    return;
  }

  theatres.clear();
}

async function toTheatre(record: TheatreRecord): Promise<Theatre> {
  const location = await findLocationById(record.locationId);
  return {
    id: record.id,
    name: record.name,
    location: location?.name ?? "",
    locationId: record.locationId,
    totalSeats: record.totalSeats,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
