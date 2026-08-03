import request from "supertest";

import { createApp } from "../src/app";
import { clearCatalogForTests } from "../src/modules/catalog/catalog.repository";
import { clearLocationsForTests } from "../src/modules/locations/location.repository";
import { clearMoviesForTests } from "../src/modules/movies/movie.repository";
import { clearPaymentsForTests } from "../src/modules/payments/payment.repository";
import { clearShowsForTests } from "../src/modules/shows/show.repository";
import { clearTheatresForTests } from "../src/modules/theatres/theatre.repository";

describe("demo payment flow", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearCatalogForTests();
    await clearLocationsForTests();
    await clearPaymentsForTests();
    await clearShowsForTests();
    await clearMoviesForTests();
    await clearTheatresForTests();
  });

  it("creates a pending demo payment with the authoritative amount, then confirms it as paid", async () => {
    const show = await createShow();

    const createResponse = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: ["A1", "A2"] })
      .expect(201);

    expect(createResponse.body.payment).toMatchObject({
      amount: 440, // show.price (220) * 2 seats
      status: "pending",
    });
    expect(createResponse.body.payment.providerReference).toMatch(/^demo-simulated-/);

    const confirmResponse = await request(app)
      .post(`/api/payments/demo/${createResponse.body.payment.id}/confirm`)
      .send({})
      .expect(200);

    expect(confirmResponse.body.message).toBe("Demo payment confirmed as paid");
    expect(confirmResponse.body.payment).toMatchObject({
      id: createResponse.body.payment.id,
      amount: 440,
      status: "paid",
    });
  });

  it("simulates a failed demo payment when asked", async () => {
    const show = await createShow();

    const createResponse = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: ["B1"] })
      .expect(201);

    const confirmResponse = await request(app)
      .post(`/api/payments/demo/${createResponse.body.payment.id}/confirm`)
      .send({ simulateFailure: true })
      .expect(200);

    expect(confirmResponse.body.message).toBe("Demo payment simulated as failed");
    expect(confirmResponse.body.payment.status).toBe("failed");
  });

  it("calculates the amount as show price times seat count, never from client input", async () => {
    const show = await createShow(); // price 220

    const oneSeat = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: ["A1"], amount: 1 }) // client-supplied amount must be ignored
      .expect(201);
    expect(oneSeat.body.payment.amount).toBe(220);

    const threeSeats = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: ["A1", "A2", "A3"] })
      .expect(201);
    expect(threeSeats.body.payment.amount).toBe(660);
  });

  it("rejects demo payment creation with no seats or an unknown show", async () => {
    const show = await createShow();

    const noSeats = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: [] })
      .expect(400);
    expect(noSeats.body.message).toBe("seatNumbers must be a non-empty array");

    const missingShowId = await request(app)
      .post("/api/payments/demo")
      .send({ seatNumbers: ["A1"] })
      .expect(400);
    expect(missingShowId.body.message).toBe("showId is required");

    const unknownShow = await request(app)
      .post("/api/payments/demo")
      .send({ showId: "00000000-0000-4000-8000-000000000000", seatNumbers: ["A1"] })
      .expect(404);
    expect(unknownShow.body.message).toBe("Show not found");
  });

  it("rejects confirming an unknown payment", async () => {
    const response = await request(app)
      .post("/api/payments/demo/00000000-0000-4000-8000-000000000000/confirm")
      .send({})
      .expect(404);

    expect(response.body.message).toBe("Payment not found");
  });

  it("rejects confirming a payment that has already been confirmed", async () => {
    const show = await createShow();
    const createResponse = await request(app)
      .post("/api/payments/demo")
      .send({ showId: show.id, seatNumbers: ["A1"] })
      .expect(201);
    const paymentId = createResponse.body.payment.id;

    await request(app).post(`/api/payments/demo/${paymentId}/confirm`).send({}).expect(200);

    const secondConfirm = await request(app)
      .post(`/api/payments/demo/${paymentId}/confirm`)
      .send({})
      .expect(409);

    expect(secondConfirm.body.message).toBe("Payment has already been paid");
  });

  async function createShow() {
    const movieResponse = await request(app).post("/api/movies").send({
      title: "Interstellar",
      genre: "Sci-Fi",
      language: "English",
      durationMinutes: 169,
      releaseDate: "2014-11-07",
    });
    const theatreResponse = await request(app).post("/api/theatres").send({
      name: "PVR Orion",
      location: "Bengaluru",
      totalSeats: 120,
    });
    const screenResponse = await request(app).post("/api/shows/screens").send({
      theatreId: theatreResponse.body.theatre.id,
      name: "Screen 1",
      rows: 10,
      seatsPerRow: 12,
    });
    const showResponse = await request(app).post("/api/shows").send({
      movieId: movieResponse.body.movie.id,
      screenId: screenResponse.body.screen.id,
      startTime: "2026-08-01T18:30:00.000Z",
      price: 220,
    });
    return showResponse.body.show;
  }
});
