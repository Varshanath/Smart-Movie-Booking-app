import { randomUUID } from "crypto";

import { isPostgresEnabled, pool } from "../../database/postgres";
import { ApiError } from "../../shared/utils/api-error";
import { Booking, CreateBookingInput } from "./booking.model";

const bookings = new Map<string, Booking>();

// Per-show promise chain used to serialize createBookingWithLock's
// check-then-insert critical section in the in-memory (no DATABASE_URL)
// fallback. Node is single-threaded, but createBooking's earlier `await`s
// (Promise.all of findUserById/findShowById/findPaymentById, etc.) still
// yield to the event loop, so two concurrent createBooking() calls for the
// same show CAN otherwise interleave right at the seat-conflict check —
// this queue closes that gap without needing real DB locking, which the
// in-memory path has no way to do. The real safety mechanism for
// production (Postgres) is the `SELECT ... FOR UPDATE` below; this is only
// so the in-memory fallback (used when tests run without DATABASE_URL)
// upholds the same guarantee.
const showBookingLockTail = new Map<string, Promise<unknown>>();

function withShowBookingLock<T>(showId: string, run: () => Promise<T>): Promise<T> {
  const previous = showBookingLockTail.get(showId) ?? Promise.resolve();
  const result = previous.then(run, run);
  showBookingLockTail.set(
    showId,
    result.catch(() => undefined),
  );
  return result;
}

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

function buildBookingRecord(input: CreateBookingInput): Booking {
  const now = new Date();
  return {
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
}

// Re-checks seat availability for input.showId and inserts the booking
// atomically, so two concurrent requests for the same seat can never both
// succeed (the race booking.service.ts's caller already validated show/
// screen/seat-label shape against — this function only re-does the part
// that's actually contended: "is this seat still free right now").
//
// Postgres: `SELECT ... FOR UPDATE` on the shows row acts as a per-show
// mutex. There's no natural per-seat row to lock (seats aren't
// materialized per show — see show.service.ts's getShowSeatMap, which
// derives seat labels arithmetically rather than from a seat-inventory
// table), so the show row is the narrowest real row available that every
// booking attempt for a given show already touches. Postgres holds a
// FOR UPDATE row lock until COMMIT/ROLLBACK, so a second transaction's
// SELECT ... FOR UPDATE on the same show blocks until the first finishes —
// meaning the second transaction's own conflict re-check is guaranteed to
// run AFTER the first transaction's insert is durably committed (or its
// failure is rolled back), closing the check-then-act gap completely.
// This does serialize *all* bookings for one show (not just conflicting
// ones), trading a little throughput for correctness — acceptable at this
// app's scale and without a schema redesign.
export async function createBookingWithLock(input: CreateBookingInput): Promise<Booking> {
  if (isPostgresEnabled && pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const showResult = await client.query(
        `SELECT id FROM shows WHERE id = $1 FOR UPDATE`,
        [input.showId],
      );
      if (showResult.rows.length === 0) {
        throw new ApiError(404, "Show not found");
      }

      const existingResult = await client.query(
        `SELECT seat_numbers AS "seatNumbers" FROM bookings WHERE show_id = $1 AND status = 'confirmed'`,
        [input.showId],
      );
      const alreadyBooked = new Set<string>(
        existingResult.rows.flatMap((row) => row.seatNumbers as string[]),
      );
      const conflictingSeat = input.seatNumbers.find((seatNumber) => alreadyBooked.has(seatNumber));
      if (conflictingSeat) {
        throw new ApiError(409, `Seat ${conflictingSeat} is already booked`);
      }

      const booking = buildBookingRecord(input);
      await client.query(
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

      await client.query("COMMIT");
      return booking;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  return withShowBookingLock(input.showId, async () => {
    const existingBookings = await listBookingsByShowId(input.showId);
    const alreadyBooked = new Set(
      existingBookings
        .filter((booking) => booking.status === "confirmed")
        .flatMap((booking) => booking.seatNumbers),
    );
    const conflictingSeat = input.seatNumbers.find((seatNumber) => alreadyBooked.has(seatNumber));
    if (conflictingSeat) {
      throw new ApiError(409, `Seat ${conflictingSeat} is already booked`);
    }

    const booking = buildBookingRecord(input);
    bookings.set(booking.id, booking);
    return booking;
  });
}

export async function clearBookingsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM bookings");
    return;
  }

  bookings.clear();
}
