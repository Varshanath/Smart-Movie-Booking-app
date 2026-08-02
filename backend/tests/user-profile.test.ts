import request from "supertest";

import { createApp } from "../src/app";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("POST /api/users/:userId/profile", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearUsersForTests();
  });

  async function registerUser() {
    const response = await request(app)
      .post("/api/users/register")
      .send({
        name: "Varsha Nath",
        gender: "female",
        location: "Bengaluru",
        moviePreference: ["Action"],
        email: "varsha@test.com",
        phoneNumber: "9876543210",
        password: "password123",
      })
      .expect(201);
    return response.body.user;
  }

  it("updates the user's location and movie preferences", async () => {
    const user = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .send({ location: "Mumbai", moviePreference: ["Comedy", "Drama"] })
      .expect(200);

    expect(response.body.message).toBe("Profile updated successfully");
    expect(response.body.user).toMatchObject({
      id: user.id,
      location: "Mumbai",
      moviePreference: ["Comedy", "Drama"],
    });
    expect(response.body.user.passwordHash).toBeUndefined();

    const loginResponse = await request(app)
      .post("/api/users/login")
      .send({ email: "varsha@test.com", password: "password123" })
      .expect(200);
    expect(loginResponse.body.user.location).toBe("Mumbai");
    expect(loginResponse.body.user.moviePreference).toEqual(["Comedy", "Drama"]);
  });

  it("rejects an empty location", async () => {
    const user = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .send({ location: "", moviePreference: ["Comedy"] })
      .expect(400);

    expect(response.body.message).toBe("location is required");
  });

  it("rejects an empty movie preference list", async () => {
    const user = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .send({ location: "Mumbai", moviePreference: [] })
      .expect(400);

    expect(response.body.message).toBe("moviePreference is required");
  });

  it("returns 404 for an unknown user", async () => {
    await request(app)
      .post("/api/users/00000000-0000-0000-0000-000000000000/profile")
      .send({ location: "Mumbai", moviePreference: ["Comedy"] })
      .expect(404);
  });
});
