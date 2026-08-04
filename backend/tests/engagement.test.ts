import request from "supertest";

import { createApp } from "../src/app";
import { callAgentService } from "../src/modules/ai-chat/ai-agent-client";
import { clearAiChatMessagesForTests } from "../src/modules/ai-chat/ai-chat.repository";
import { ApiError } from "../src/shared/utils/api-error";

jest.mock("../src/modules/ai-chat/ai-agent-client");

const mockedCallAgentService = callAgentService as jest.MockedFunction<
  typeof callAgentService
>;
import { clearBookingsForTests } from "../src/modules/bookings/booking.repository";
import { clearCatalogForTests } from "../src/modules/catalog/catalog.repository";
import { clearCouponsForTests } from "../src/modules/coupons/coupon.repository";
import { clearLocationsForTests } from "../src/modules/locations/location.repository";
import { clearMoviesForTests } from "../src/modules/movies/movie.repository";
import { clearNotificationsForTests } from "../src/modules/notifications/notification.repository";
import { clearPaymentsForTests } from "../src/modules/payments/payment.repository";
import { clearRecommendationsForTests } from "../src/modules/recommendations/recommendation.repository";
import { clearReviewsForTests } from "../src/modules/reviews/review.repository";
import { clearSearchHistoryForTests } from "../src/modules/search-history/search-history.repository";
import { clearShowsForTests } from "../src/modules/shows/show.repository";
import { clearTheatresForTests } from "../src/modules/theatres/theatre.repository";
import { clearUsersForTests } from "../src/modules/users/user.repository";
import { clearWatchlistsForTests } from "../src/modules/watchlist/watchlist.repository";

describe("engagement APIs", () => {
  const app = createApp();

  beforeEach(async () => {
    mockedCallAgentService.mockReset();
    await clearAiChatMessagesForTests();
    await clearBookingsForTests();
    await clearCatalogForTests();
    await clearCouponsForTests();
    await clearLocationsForTests();
    await clearMoviesForTests();
    await clearNotificationsForTests();
    await clearPaymentsForTests();
    await clearRecommendationsForTests();
    await clearReviewsForTests();
    await clearSearchHistoryForTests();
    await clearShowsForTests();
    await clearTheatresForTests();
    await clearUsersForTests();
    await clearWatchlistsForTests();
  });

  it("creates and lists a review for a movie and for its author", async () => {
    const user = await registerUser();
    const movie = await createMovie();

    const response = await request(app)
      .post(`/api/movies/${movie.id}/reviews`)
      .send({ userId: user.id, rating: 4.5, reviewText: "Loved it." })
      .expect(201);

    expect(response.body.review).toMatchObject({
      userId: user.id,
      movieId: movie.id,
      rating: 4.5,
      reviewText: "Loved it.",
    });

    const byMovie = await request(app).get(`/api/movies/${movie.id}/reviews`).expect(200);
    expect(byMovie.body.reviews).toHaveLength(1);

    const byUser = await request(app)
      .get(`/api/users/${user.id}/reviews`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(byUser.body.reviews).toHaveLength(1);
  });

  it("rejects a review with an out-of-range rating", async () => {
    const user = await registerUser();
    const movie = await createMovie();

    const response = await request(app)
      .post(`/api/movies/${movie.id}/reviews`)
      .send({ userId: user.id, rating: 9, reviewText: "Too high" })
      .expect(400);

    expect(response.body.message).toBe("rating must be a number between 0 and 5");
  });

  it("adds, lists, and removes a watchlist item", async () => {
    const user = await registerUser();
    const movie = await createMovie();

    await request(app)
      .post(`/api/users/${user.id}/watchlist`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ movieId: movie.id })
      .expect(201);

    const listed = await request(app)
      .get(`/api/users/${user.id}/watchlist`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(listed.body.watchlist).toContainEqual(
      expect.objectContaining({ userId: user.id, movieId: movie.id }),
    );

    await request(app)
      .delete(`/api/users/${user.id}/watchlist/${movie.id}`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    const afterRemoval = await request(app)
      .get(`/api/users/${user.id}/watchlist`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(afterRemoval.body.watchlist).toHaveLength(0);
  });

  it("returns an empty recommendations list when none exist", async () => {
    const user = await registerUser();
    const response = await request(app)
      .get(`/api/users/${user.id}/recommendations`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(response.body.recommendations).toEqual([]);
  });

  it("returns 404 when marking a notification that does not exist", async () => {
    const user = await registerUser();
    const response = await request(app)
      .post(`/api/users/${user.id}/notifications/missing-id/read`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(404);
    expect(response.body.message).toBe("Notification not found");
  });

  it("records and lists search history", async () => {
    const user = await registerUser();

    await request(app)
      .post(`/api/users/${user.id}/search-history`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ query: "Batman" })
      .expect(201);

    const response = await request(app)
      .get(`/api/users/${user.id}/search-history`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(response.body.searchHistory).toContainEqual(
      expect.objectContaining({ userId: user.id, query: "Batman" }),
    );
  });

  it("sends an AI chat prompt to the agent service and stores its response", async () => {
    mockedCallAgentService.mockResolvedValueOnce({
      sessionId: "test-session",
      response: "Here are a few thriller picks for you.",
    });

    const user = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/ai-chat`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ prompt: "Recommend a thriller." })
      .expect(201);

    expect(mockedCallAgentService).toHaveBeenCalledWith(
      user.id,
      "Recommend a thriller.",
      user.id,
    );
    expect(response.body.message).toMatchObject({
      userId: user.id,
      prompt: "Recommend a thriller.",
      response: "Here are a few thriller picks for you.",
    });

    const history = await request(app)
      .get(`/api/users/${user.id}/ai-chat`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(history.body.messages).toHaveLength(1);
  });

  it("returns a clear error when the AI agent service is unavailable", async () => {
    mockedCallAgentService.mockRejectedValueOnce(
      new ApiError(503, "AI agent service is unavailable"),
    );

    const user = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/ai-chat`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ prompt: "Recommend a thriller." })
      .expect(503);

    expect(response.body.message).toBe("AI agent service is unavailable");

    const history = await request(app)
      .get(`/api/users/${user.id}/ai-chat`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);
    expect(history.body.messages).toHaveLength(0);
  });

  it("returns 404 for an unknown coupon code", async () => {
    const response = await request(app).get("/api/coupons/NOPE").expect(404);
    expect(response.body.message).toBe("Coupon not found");
  });

  it("returns zeroed analytics when there is no booking activity", async () => {
    const movie = await createMovie();

    const movieStats = await request(app).get("/api/analytics/movies").expect(200);
    expect(movieStats.body.movies).toContainEqual(
      expect.objectContaining({ movieId: movie.id, totalBookings: 0, totalSeatsBooked: 0 }),
    );

    const revenue = await request(app).get("/api/analytics/revenue").expect(200);
    expect(revenue.body.revenue).toEqual([]);

    const occupancy = await request(app).get("/api/analytics/occupancy").expect(200);
    expect(occupancy.body.occupancy).toEqual([]);
  });

  it("lists a screen's seat inventory (empty without the seed script)", async () => {
    const theatre = await createTheatre();
    const screen = await createScreen(theatre.id);

    const response = await request(app).get(`/api/shows/screens/${screen.id}/seats`).expect(200);
    expect(response.body.seats).toEqual([]);
  });

  async function registerUser() {
    const response = await request(app).post("/api/users/register").send({
      name: "Engagement Tester",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "engagement.tester@test.com",
      phoneNumber: "9876500000",
      password: "password123",
    });
    return { ...response.body.user, token: response.body.token as string };
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

  async function createScreen(theatreId: string) {
    const response = await request(app).post("/api/shows/screens").send({
      theatreId,
      name: "Screen 1",
      rows: 10,
      seatsPerRow: 12,
    });
    return response.body.screen;
  }
});
