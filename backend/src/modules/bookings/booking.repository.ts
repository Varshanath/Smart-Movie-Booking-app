import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { Booking, CreateBookingInput } from "./booking.model";

const bookings = new Map<string, Booking>();

export async function listBookings() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT
        id,
        user_id AS "userId",
        movie_id AS "movieId",
        theatre_id AS "theatreId",
        show_time AS "showTime",
        seats,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM bookings
      ORDER BY created_at DESC
    `);
    return result.rows as Booking[];
  }

  return Array.from(bookings.values());
}

export async function saveBooking(input: CreateBookingInput) {
  const now = new Date();
  const booking: Booking = {
    id: randomUUID(),
    ...input,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO bookings (
          id, user_id, movie_id, theatre_id, show_time, seats, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        booking.id,
        booking.userId,
        booking.movieId,
        booking.theatreId,
        booking.showTime,
        booking.seats,
        booking.status,
        booking.createdAt,
        booking.updatedAt,
      ],
    );
    return booking;
  }

  bookings.set(booking.id, booking);
  return booking;
}

export async function clearBookingsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM bookings");
    return;
  }

  bookings.clear();
}
