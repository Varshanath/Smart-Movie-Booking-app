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
        password: "password123",
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
      password: "password123",
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

describe("POST /api/users/login", () => {
  const app = createApp();

  beforeEach(() => {
    clearUsersForTests();
  });

  it("logs in a registered user with the correct password", async () => {
    await request(app).post("/api/users/register").send({
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "varsha@test.com", password: "password123" })
      .expect(200);

    expect(response.body.message).toBe("Login successful");
    expect(response.body.user.email).toBe("varsha@test.com");
    expect(response.body.user.password).toBeUndefined();
  });

  it("rejects unregistered users", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "missing@test.com", password: "password123" })
      .expect(401);

    expect(response.body.message).toBe("Email ID or password is incorrect");
  });

  it("rejects wrong passwords", async () => {
    await request(app).post("/api/users/register").send({
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
      password: "password123",
    });

    await request(app)
      .post("/api/users/login")
      .send({ email: "varsha@test.com", password: "wrong123" })
      .expect(401);
  });
});

describe("POST /api/users/change-password", () => {
  const app = createApp();

  beforeEach(() => {
    clearUsersForTests();
  });

  it("changes the password and requires the new password after that", async () => {
    await request(app).post("/api/users/register").send({
      name: "Varsha Nath",
      gender: "female",
      location: "Bengaluru",
      moviePreference: ["Action"],
      email: "varsha@test.com",
      phoneNumber: "9876543210",
      password: "password123",
    });

    await request(app)
      .post("/api/users/change-password")
      .send({
        email: "varsha@test.com",
        currentPassword: "password123",
        newPassword: "newpass123",
      })
      .expect(200);

    await request(app)
      .post("/api/users/login")
      .send({ email: "varsha@test.com", password: "password123" })
      .expect(401);

    await request(app)
      .post("/api/users/login")
      .send({ email: "varsha@test.com", password: "newpass123" })
      .expect(200);
  });
});
