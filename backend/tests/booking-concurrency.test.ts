import request from "supertest";

import { createApp } from "../src/app";
import { isPostgresEnabled, pool } from "../src/database/postgres";
import { createBookingWithLock } from "../src/modules/bookings/booking.repository";

// Real DB locking can only be meaningfully proven against real PostgreSQL —
// the in-memory fallback has no transactions/row locks to verify. This
// suite is skipped entirely when DATABASE_URL isn't set (the default for
// `npm test`), and never calls the global clear*ForTests() helpers — those
// truncate whole tables, which would destroy the shared seed dataset this
// project's DATABASE_URL points at. Every fixture this file creates is
// deleted individually, by its own captured id, in afterEach.
const describeIfPostgres = isPostgresEnabled ? describe : describe.skip;

// Each test does several sequential HTTP round-trips (register/movie/
// theatre/screen/show/payment) against a real, remote Postgres instance —
// comfortably over jest's 5s default under real network latency.
jest.setTimeout(30000);

describeIfPostgres("booking concurrency (real PostgreSQL, no in-memory fallback)", () => {
  const app = createApp();

  let createdIds: {
    userId?: string;
    movieId?: string;
    theatreId?: string;
    locationId?: string;
    screenId?: string;
    showId?: string;
    paymentIds: string[];
  } = { paymentIds: [] };

  afterEach(async () => {
    if (pool) {
      if (createdIds.showId) {
        await pool.query("DELETE FROM bookings WHERE show_id = $1", [createdIds.showId]);
        await pool.query("DELETE FROM shows WHERE id = $1", [createdIds.showId]);
      }
      if (createdIds.screenId) {
        await pool.query("DELETE FROM screens WHERE id = $1", [createdIds.screenId]);
      }
      if (createdIds.theatreId) {
        await pool.query("DELETE FROM theatres WHERE id = $1", [createdIds.theatreId]);
      }
      // Theatre creation auto-creates its named location if it doesn't
      // already exist (findOrCreateLocationByName) — this test always uses
      // a unique, never-seen-before city name, so it's always our own row.
      if (createdIds.locationId) {
        await pool.query("DELETE FROM locations WHERE id = $1", [createdIds.locationId]);
      }
      if (createdIds.movieId) {
        await pool.query("DELETE FROM movies WHERE id = $1", [createdIds.movieId]);
      }
      if (createdIds.userId) {
        await pool.query("DELETE FROM users WHERE id = $1", [createdIds.userId]);
      }
      for (const paymentId of createdIds.paymentIds) {
        await pool.query("DELETE FROM payments WHERE id = $1", [paymentId]);
      }
    }
    createdIds = { paymentIds: [] };
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("allows exactly one of two concurrent requests for the same seat to succeed", async () => {
    const { showId, token } = await createFixtureShow();
    const paymentA = await createPayment();
    const paymentB = await createPayment();
    createdIds.paymentIds.push(paymentA.id, paymentB.id);

    const [responseA, responseB] = await Promise.all([
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: createdIds.userId, showId, paymentId: paymentA.id, seatNumbers: ["A1"] }),
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: createdIds.userId, showId, paymentId: paymentB.id, seatNumbers: ["A1"] }),
    ]);

    const statuses = [responseA.status, responseB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const winner = responseA.status === 201 ? responseA : responseB;
    expect(winner.body.booking.seatNumbers).toEqual(["A1"]);

    const dbRows = await pool!.query(
      `SELECT seat_numbers AS "seatNumbers" FROM bookings WHERE show_id = $1 AND status = 'confirmed'`,
      [showId],
    );
    const confirmedSeatsContainingA1 = dbRows.rows.filter((row) =>
      (row.seatNumbers as string[]).includes("A1"),
    );
    expect(confirmedSeatsContainingA1).toHaveLength(1);
  });

  it("allows two concurrent requests for different seats on the same show to both succeed", async () => {
    const { showId, token } = await createFixtureShow();
    const paymentA = await createPayment();
    const paymentB = await createPayment();
    createdIds.paymentIds.push(paymentA.id, paymentB.id);

    const [responseA, responseB] = await Promise.all([
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: createdIds.userId, showId, paymentId: paymentA.id, seatNumbers: ["A1"] }),
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: createdIds.userId, showId, paymentId: paymentB.id, seatNumbers: ["B1"] }),
    ]);

    expect(responseA.status).toBe(201);
    expect(responseB.status).toBe(201);

    const dbRows = await pool!.query(
      `SELECT seat_numbers AS "seatNumbers" FROM bookings WHERE show_id = $1 AND status = 'confirmed'`,
      [showId],
    );
    const allBookedSeats = dbRows.rows.flatMap((row) => row.seatNumbers as string[]);
    expect(allBookedSeats.sort()).toEqual(["A1", "B1"]);
  });

  it("rolls back and releases the lock when the booking insert itself fails", async () => {
    const { showId, userId, token } = await createFixtureShow();
    const nonExistentPaymentId = "00000000-0000-4000-8000-000000000000";

    // Calls the repository function directly (bypassing booking.service.ts's
    // payment-existence pre-check) so the real payment_id foreign-key
    // constraint is what fails, at INSERT time, inside the transaction —
    // this is the only reliable way to force a genuine DB-level insert
    // failure without going through a path the application layer already
    // guards against.
    await expect(
      createBookingWithLock({
        userId,
        showId,
        paymentId: nonExistentPaymentId,
        seatNumbers: ["A1"],
      }),
    ).rejects.toThrow();

    const rowsAfterFailure = await pool!.query(
      `SELECT * FROM bookings WHERE show_id = $1`,
      [showId],
    );
    expect(rowsAfterFailure.rows).toHaveLength(0);

    // If ROLLBACK hadn't released the FOR UPDATE lock, this would hang/
    // deadlock instead of completing.
    const payment = await createPayment();
    createdIds.paymentIds.push(payment.id);
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId, showId, paymentId: payment.id, seatNumbers: ["A1"] });
    expect(response.status).toBe(201);
  });

  async function createFixtureShow() {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const userResponse = await request(app).post("/api/users/register").send({
      name: "Concurrency Test User",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: `concurrency-${suffix}@test.com`,
      phoneNumber: `9${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 10)}`,
      password: "password123",
    });
    const userId = userResponse.body.user.id;
    const token = userResponse.body.token as string;

    const movieResponse = await request(app).post("/api/movies").send({
      title: `Concurrency Test Movie ${suffix}`,
      genre: "Action",
      language: "English",
      durationMinutes: 120,
      releaseDate: "2020-01-01",
    });
    const movieId = movieResponse.body.movie.id;

    const theatreResponse = await request(app).post("/api/theatres").send({
      name: `Concurrency Test Theatre ${suffix}`,
      location: `Concurrency Test City ${suffix}`,
      totalSeats: 4,
    });
    const theatreId = theatreResponse.body.theatre.id;
    const locationId = theatreResponse.body.theatre.locationId;

    const screenResponse = await request(app).post("/api/shows/screens").send({
      theatreId,
      name: "Screen 1",
      rows: 2,
      seatsPerRow: 2,
    });
    const screenId = screenResponse.body.screen.id;

    const showResponse = await request(app).post("/api/shows").send({
      movieId,
      screenId,
      startTime: "2026-08-01T18:30:00.000Z",
      price: 200,
    });
    const showId = showResponse.body.show.id;

    createdIds = { ...createdIds, userId, movieId, theatreId, locationId, screenId, showId };
    return { userId, movieId, theatreId, screenId, showId, token };
  }

  async function createPayment() {
    const response = await request(app).post("/api/payments").send({
      amount: 200,
      status: "paid",
      providerReference: `concurrency-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    return response.body.payment;
  }
});
