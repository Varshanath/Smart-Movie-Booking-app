import request from "supertest";

import { createApp } from "../src/app";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("POST /api/users/:userId/profile", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearUsersForTests();
  });

  async function registerUser(email = "varsha@test.com", phoneNumber = "9876543210") {
    const response = await request(app)
      .post("/api/users/register")
      .send({
        name: "Varsha Nath",
        gender: "female",
        location: "Bengaluru",
        moviePreference: ["Action"],
        email,
        phoneNumber,
        password: "password123",
      })
      .expect(201);
    return { user: response.body.user, token: response.body.token as string };
  }

  it("updates the user's location and movie preferences", async () => {
    const { user, token } = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`)
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
    const { user, token } = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send({ location: "", moviePreference: ["Comedy"] })
      .expect(400);

    expect(response.body.message).toBe("location is required");
  });

  it("rejects an empty movie preference list", async () => {
    const { user, token } = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send({ location: "Mumbai", moviePreference: [] })
      .expect(400);

    expect(response.body.message).toBe("moviePreference is required");
  });

  it("rejects requests with no Authorization header", async () => {
    const { user } = await registerUser();

    const response = await request(app)
      .post(`/api/users/${user.id}/profile`)
      .send({ location: "Mumbai", moviePreference: ["Comedy"] })
      .expect(401);

    expect(response.body.message).toBe("Authentication is required");
  });

  it("rejects updating another user's profile even with a valid token", async () => {
    const { token: userAToken } = await registerUser("user-a@test.com", "9876543210");
    const { user: userB } = await registerUser("user-b@test.com", "9876543211");

    const response = await request(app)
      .post(`/api/users/${userB.id}/profile`)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ location: "Mumbai", moviePreference: ["Comedy"] })
      .expect(403);

    expect(response.body.message).toBe("You do not have access to this resource");
  });
});
