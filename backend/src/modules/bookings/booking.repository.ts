import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { Booking, CreateBookingInput } from "./booking.model";

const bookings = new Map<string, Booking>();

const SELECT_COLUMNS = `
  id,
  user_id AS "userId",
  show_id AS "showId",
  payment_id AS "paymentId",
  seat_numbers AS "seatNumbers",
  seats,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function listBookings() {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM bookings ORDER BY created_at DESC`,
    );
    return result.rows as Booking[];
  }

  return Array.from(bookings.values());
}

export async function listBookingsByShowId(showId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM bookings WHERE show_id = $1`,
      [showId],
    );
    return result.rows as Booking[];
  }

  return Array.from(bookings.values()).filter(
    (booking) => booking.showId === showId,
  );
}

export async function saveBooking(input: CreateBookingInput) {
  const now = new Date();
  const booking: Booking = {
    id: randomUUID(),
    userId: input.userId,
    showId: input.showId,
    paymentId: input.paymentId,
    seatNumbers: input.seatNumbers,
    seats: input.seatNumbers.length,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgresEnabled && pool) {
    await pool.query(
      `
        INSERT INTO bookings (
          id, user_id, show_id, payment_id, seat_numbers, seats, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        booking.id,
        booking.userId,
        booking.showId,
        booking.paymentId,
        booking.seatNumbers,
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
