import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { signAuthToken } from "../src/modules/auth/token";
import { authenticate } from "../src/shared/middleware/authenticate";
import { errorHandler } from "../src/shared/middleware/error-handler";

function buildTestApp() {
  const app = express();
  app.get("/protected", authenticate, (req, res) => {
    res.status(200).json({ userId: req.user?.id });
  });
  app.use(errorHandler);
  return app;
}

describe("authenticate middleware", () => {
  const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-only-secret-not-used-anywhere-real";
  });

  afterEach(() => {
    process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
  });

  it("populates req.user.id for a valid bearer token", async () => {
    const app = buildTestApp();
    const token = signAuthToken("user-123");

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ userId: "user-123" });
  });

  it("rejects a request with no Authorization header", async () => {
    const app = buildTestApp();

    const response = await request(app).get("/protected").expect(401);

    expect(response.body.message).toBe("Authentication is required");
  });

  it("rejects a malformed Authorization header (missing Bearer scheme)", async () => {
    const app = buildTestApp();
    const token = signAuthToken("user-123");

    await request(app).get("/protected").set("Authorization", token).expect(401);
  });

  it("rejects a malformed Authorization header (wrong scheme)", async () => {
    const app = buildTestApp();
    const token = signAuthToken("user-123");

    await request(app).get("/protected").set("Authorization", `Basic ${token}`).expect(401);
  });

  it("rejects an invalid JWT", async () => {
    const app = buildTestApp();

    await request(app).get("/protected").set("Authorization", "Bearer not-a-real-jwt").expect(401);
  });

  it("rejects an expired JWT", async () => {
    const app = buildTestApp();
    const expired = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET as string, {
      algorithm: "HS256",
      expiresIn: -10,
    });

    await request(app).get("/protected").set("Authorization", `Bearer ${expired}`).expect(401);
  });

  it("rejects a tampered JWT", async () => {
    const app = buildTestApp();
    const token = signAuthToken("user-123");
    const parts = token.split(".");
    const lastChar = parts[2].slice(-1);
    parts[2] = parts[2].slice(0, -1) + (lastChar === "A" ? "B" : "A");
    const tampered = parts.join(".");

    await request(app).get("/protected").set("Authorization", `Bearer ${tampered}`).expect(401);
  });

  it("never reveals the rejected token or verification reason in the error response", async () => {
    const app = buildTestApp();

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer some-secret-looking-token-value")
      .expect(401);

    expect(JSON.stringify(response.body)).not.toContain("some-secret-looking-token-value");
    expect(response.body.message).toBe("Authentication is required");
  });
});
