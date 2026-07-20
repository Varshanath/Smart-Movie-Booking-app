import request from "supertest";

import { createApp } from "../src/app";
import { clearBookingsForTests } from "../src/modules/bookings/booking.repository";
import { clearMoviesForTests } from "../src/modules/movies/movie.repository";
import { clearTheatresForTests } from "../src/modules/theatres/theatre.repository";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("movie, theatre, and booking APIs", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearBookingsForTests();
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

  it("creates a booking for an existing user, movie, and theatre", async () => {
    const user = await registerUser();
    const movie = await createMovie();
    const theatre = await createTheatre();

    const response = await request(app)
      .post("/api/bookings")
      .send({
        userId: user.id,
        movieId: movie.id,
        theatreId: theatre.id,
        showTime: "2026-08-01T18:30:00.000Z",
        seats: 2,
      })
      .expect(201);

    expect(response.body.message).toBe("Booking created successfully");
    expect(response.body.booking).toMatchObject({
      userId: user.id,
      movieId: movie.id,
      theatreId: theatre.id,
      showTime: "2026-08-01T18:30:00.000Z",
      seats: 2,
      status: "confirmed",
    });

    const listResponse = await request(app).get("/api/bookings").expect(200);
    expect(listResponse.body.bookings).toHaveLength(1);
  });

  it("rejects booking for an unknown movie", async () => {
    const user = await registerUser();
    const theatre = await createTheatre();

    const response = await request(app)
      .post("/api/bookings")
      .send({
        userId: user.id,
        movieId: "missing-movie",
        theatreId: theatre.id,
        showTime: "2026-08-01T18:30:00.000Z",
        seats: 2,
      })
      .expect(404);

    expect(response.body.message).toBe("Movie not found");
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

  async function createTheatre() {
    const response = await request(app).post("/api/theatres").send({
      name: "PVR Orion",
      location: "Bengaluru",
      totalSeats: 120,
    });

    return response.body.theatre;
  }
});
