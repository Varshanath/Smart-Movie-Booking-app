import request from "supertest";

import { createApp } from "../src/app";
import { clearBookingsForTests } from "../src/modules/bookings/booking.repository";
import { clearCatalogForTests } from "../src/modules/catalog/catalog.repository";
import { clearMoviesForTests } from "../src/modules/movies/movie.repository";
import { clearPaymentsForTests } from "../src/modules/payments/payment.repository";
import { clearShowsForTests } from "../src/modules/shows/show.repository";
import { clearTheatresForTests } from "../src/modules/theatres/theatre.repository";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("movie, theatre, and booking APIs", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearBookingsForTests();
    await clearCatalogForTests();
    await clearPaymentsForTests();
    await clearShowsForTests();
    await clearMoviesForTests();
    await clearTheatresForTests();
    await clearUsersForTests();
  });

  it("creates and lists movies", async () => {
    const response = await request(app)
      .post("/api/movies")
      .send({
        title: "Interstellar",
        genre: "Sci-Fi",
        language: "English",
        durationMinutes: 169,
        releaseDate: "2014-11-07",
      })
      .expect(201);

    expect(response.body.message).toBe("Movie created successfully");
    expect(response.body.movie).toMatchObject({
      title: "Interstellar",
      genre: "Sci-Fi",
      language: "English",
      durationMinutes: 169,
      releaseDate: "2014-11-07",
    });

    const listResponse = await request(app).get("/api/movies").expect(200);
    expect(listResponse.body.movies).toHaveLength(1);
  });

  it("creates and lists theatres", async () => {
    const response = await request(app)
      .post("/api/theatres")
      .send({
        name: "PVR Orion",
        location: "Bengaluru",
        totalSeats: 120,
      })
      .expect(201);

    expect(response.body.message).toBe("Theatre created successfully");
    expect(response.body.theatre).toMatchObject({
      name: "PVR Orion",
      location: "Bengaluru",
      totalSeats: 120,
    });

    const listResponse = await request(app).get("/api/theatres").expect(200);
    expect(listResponse.body.theatres).toHaveLength(1);
  });

  it("creates catalog entries and links movie genre and cast", async () => {
    const movie = await createMovie();
    const genre = await createGenre();
    const actor = await createActor();

    await request(app)
      .post(`/api/movies/${movie.id}/genres`)
      .send({ genreId: genre.id })
      .expect(201);

    await request(app)
      .post(`/api/movies/${movie.id}/cast`)
      .send({ actorId: actor.id, roleName: "Cooper" })
      .expect(201);

    const genres = await request(app)
      .get(`/api/movies/${movie.id}/genres`)
      .expect(200);
    const cast = await request(app).get(`/api/movies/${movie.id}/cast`).expect(200);

    expect(genres.body.genres).toContainEqual(
      expect.objectContaining({ id: genre.id, name: "Sci-Fi" }),
    );
    expect(cast.body.cast).toContainEqual(
      expect.objectContaining({ id: actor.id, name: "Matthew McConaughey", roleName: "Cooper" }),
    );
  });

  it("creates user preferences and watch history", async () => {
    const user = await registerUser();
    const movie = await createMovie();
    const genre = await createGenre();
    const language = await createLanguage();

    await request(app)
      .post(`/api/users/${user.id}/preferences`)
      .send({ genreId: genre.id, languageId: language.id })
      .expect(201);

    await request(app)
      .post(`/api/users/${user.id}/watch-history`)
      .send({ movieId: movie.id })
      .expect(201);

    const preferences = await request(app)
      .get(`/api/users/${user.id}/preferences`)
      .expect(200);
    const history = await request(app)
      .get(`/api/users/${user.id}/watch-history`)
      .expect(200);

    expect(preferences.body.preferences).toContainEqual(
      expect.objectContaining({ userId: user.id, genreId: genre.id, languageId: language.id }),
    );
    expect(history.body.watchHistory).toContainEqual(
      expect.objectContaining({ userId: user.id, movieId: movie.id }),
    );
  });

  it("creates a booking for an existing user, show, and payment", async () => {
    const user = await registerUser();
    const movie = await createMovie();
    const theatre = await createTheatre();
    const screen = await createScreen(theatre.id);
    const show = await createShow(movie.id, screen.id);
    const payment = await createPayment();

    const response = await request(app)
      .post("/api/bookings")
      .send({
        userId: user.id,
        showId: show.id,
        paymentId: payment.id,
        seats: 2,
      })
      .expect(201);

    expect(response.body.message).toBe("Booking created successfully");
    expect(response.body.booking).toMatchObject({
      userId: user.id,
      showId: show.id,
      paymentId: payment.id,
      seats: 2,
      status: "confirmed",
    });

    const listResponse = await request(app).get("/api/bookings").expect(200);
    expect(listResponse.body.bookings).toHaveLength(1);
  });

  it("creates a movie booking through the dedicated movie booking API", async () => {
    const user = await registerUser();
    const movie = await createMovie();
    const theatre = await createTheatre();
    const screen = await createScreen(theatre.id);
    const show = await createShow(movie.id, screen.id);
    const payment = await createPayment();

    const response = await request(app)
      .post("/api/bookings/movie")
      .send({
        userId: user.id,
        showId: show.id,
        paymentId: payment.id,
        seats: 3,
      })
      .expect(201);

    expect(response.body.message).toBe("Movie booking created successfully");
    expect(response.body.booking).toMatchObject({
      userId: user.id,
      showId: show.id,
      paymentId: payment.id,
      seats: 3,
      status: "confirmed",
    });
  });

  it("rejects booking for an unknown show", async () => {
    const user = await registerUser();
    const payment = await createPayment();

    const response = await request(app)
      .post("/api/bookings")
      .send({
        userId: user.id,
        showId: "missing-show",
        paymentId: payment.id,
        seats: 2,
      })
      .expect(404);

    expect(response.body.message).toBe("Show not found");
  });

  async function registerUser() {
    const response = await request(app).post("/api/users/register").send({
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
      password: "password123",
    });

    return response.body.user;
  }

  async function createMovie() {
    const response = await request(app).post("/api/movies").send({
      title: "Interstellar",
      genre: "Sci-Fi",
      language: "English",
      durationMinutes: 169,
      releaseDate: "2014-11-07",
    });

    return response.body.movie;
  }

  async function createGenre() {
    const response = await request(app)
      .post("/api/catalog/genres")
      .send({ name: "Sci-Fi" });
    return response.body.genre;
  }

  async function createLanguage() {
    const response = await request(app)
      .post("/api/catalog/languages")
      .send({ name: "English" });
    return response.body.language;
  }

  async function createActor() {
    const response = await request(app)
      .post("/api/catalog/actors")
      .send({ name: "Matthew McConaughey" });
    return response.body.actor;
  }

  async function createTheatre() {
    const response = await request(app).post("/api/theatres").send({
      name: "PVR Orion",
      location: "Bengaluru",
      totalSeats: 120,
    });

    return response.body.theatre;
  }

  async function createScreen(theatreId: string) {
    const response = await request(app).post("/api/shows/screens").send({
      theatreId,
      name: "Screen 1",
      totalSeats: 120,
    });

    return response.body.screen;
  }

  async function createShow(movieId: string, screenId: string) {
    const response = await request(app).post("/api/shows").send({
      movieId,
      screenId,
      startTime: "2026-08-01T18:30:00.000Z",
    });

    return response.body.show;
  }

  async function createPayment() {
    const response = await request(app).post("/api/payments").send({
      amount: 500,
      status: "paid",
      providerReference: "pay_test_123",
    });

    return response.body.payment;
  }
});
