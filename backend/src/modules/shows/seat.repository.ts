import { isPostgresEnabled, pool } from "../../database/postgres";
import { Seat } from "./seat.model";

const SELECT_COLUMNS = `
  id,
  screen_id AS "screenId",
  row_label AS "rowLabel",
  seat_number AS "seatNumber",
  seat_type AS "seatType"
`;

// Seat inventory is only ever populated by the demo data seed script
// (backend/src/database/seeders/seed-full-demo-data.ts) via direct SQL —
// there is no create-seat endpoint, so the in-memory fallback has nothing
// to return.
export async function listSeatsByScreenId(screenId: string): Promise<Seat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM seats WHERE screen_id = $1 ORDER BY row_label, seat_number`,
      [screenId],
    );
    return result.rows as Seat[];
  }
  return [];
}
