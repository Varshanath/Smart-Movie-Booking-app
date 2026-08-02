import request from "supertest";

import { createApp } from "../src/app";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("GET /api/users", () => {
  const app = createApp();

  beforeEach(async () => {
    await clearUsersForTests();
  });

  async function registerUser(overrides: Partial<Record<string, unknown>> = {}) {
    const payload = {
      name: "Priya Nair",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Thriller"],
      email: "priya@test.com",
      phoneNumber: "9876500001",
      password: "password123",
      ...overrides,
    };
    const response = await request(app).post("/api/users/register").send(payload).expect(201);
    return response.body.user;
  }

  it("returns registered users matching the search term", async () => {
    await registerUser({ name: "Priya Nair", email: "priya@test.com", phoneNumber: "9876500001" });
    await registerUser({ name: "Rahul Verma", email: "rahul@test.com", phoneNumber: "9876500002" });

    const response = await request(app).get("/api/users").query({ search: "priya" }).expect(200);

    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0]).toMatchObject({ name: "Priya Nair", email: "priya@test.com" });
    expect(response.body.users[0].passwordHash).toBeUndefined();
  });

  it("excludes the given user id from results", async () => {
    const priya = await registerUser({ name: "Priya Nair", email: "priya@test.com", phoneNumber: "9876500001" });
    await registerUser({ name: "Priyanka Shah", email: "priyanka@test.com", phoneNumber: "9876500003" });

    const response = await request(app)
      .get("/api/users")
      .query({ search: "priy", excludeUserId: priya.id })
      .expect(200);

    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].name).toBe("Priyanka Shah");
  });

  it("returns a default list when no search term is given", async () => {
    await registerUser({ name: "Priya Nair", email: "priya@test.com", phoneNumber: "9876500001" });
    await registerUser({ name: "Rahul Verma", email: "rahul@test.com", phoneNumber: "9876500002" });

    const response = await request(app).get("/api/users").expect(200);

    expect(response.body.users.length).toBeGreaterThanOrEqual(2);
  });
});
