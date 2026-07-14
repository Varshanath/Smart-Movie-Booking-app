import request from "supertest";

import { createApp } from "../src/app";
import { clearUsersForTests } from "../src/modules/users/user.repository";

describe("POST /api/users/register", () => {
  const app = createApp();

  beforeEach(() => {
    clearUsersForTests();
  });

  it("registers a user", async () => {
    const response = await request(app)
      .post("/api/users/register")
      .send({
        name: "Varsha Nath",
        gender: "female",
        location: "Bengaluru",
        moviePreference: ["Action", "Comedy"],
        email: "varsha@test.com",
        phoneNumber: "9876543210",
      })
      .expect(201);

    expect(response.body.message).toBe("User registered successfully");
    expect(response.body.user).toMatchObject({
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action", "Comedy"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
    });
    expect(response.body.user.id).toEqual(expect.any(String));
  });

  it("rejects duplicate email IDs", async () => {
    const payload = {
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
    };

    await request(app).post("/api/users/register").send(payload).expect(201);

    await request(app)
      .post("/api/users/register")
      .send({ ...payload, phoneNumber: "9876543211" })
      .expect(409);
  });

  it("rejects invalid request bodies", async () => {
    const response = await request(app)
      .post("/api/users/register")
      .send({ name: "" })
      .expect(400);

    expect(response.body.message).toBe("name is required");
  });
});
