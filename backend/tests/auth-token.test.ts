import jwt from "jsonwebtoken";

import { signAuthToken, verifyAuthToken } from "../src/modules/auth/token";

describe("auth token helper", () => {
  const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-only-secret-not-used-anywhere-real";
  });

  afterEach(() => {
    process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
  });

  it("generates a token for a valid userId", () => {
    const token = signAuthToken("user-123");

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("verifies a token it just generated", () => {
    const token = signAuthToken("user-123");

    expect(() => verifyAuthToken(token)).not.toThrow();
  });

  it("returns the correct userId from a verified token", () => {
    const token = signAuthToken("user-456");

    const result = verifyAuthToken(token);

    expect(result).toEqual({ userId: "user-456" });
  });

  it("does not put any other user data in the token payload", () => {
    const token = signAuthToken("user-123");
    const decoded = jwt.decode(token) as Record<string, unknown>;

    expect(decoded.sub).toBe("user-123");
    expect(decoded.email).toBeUndefined();
    expect(decoded.password).toBeUndefined();
    expect(decoded.name).toBeUndefined();
    expect(decoded.role).toBeUndefined();
  });

  it("rejects a malformed token", () => {
    expect(() => verifyAuthToken("not-a-jwt-at-all")).toThrow();
  });

  it("rejects a modified/tampered token", () => {
    const token = signAuthToken("user-123");
    const parts = token.split(".");
    // Flip the last character of the signature so it no longer matches.
    const lastChar = parts[2].slice(-1);
    parts[2] = parts[2].slice(0, -1) + (lastChar === "A" ? "B" : "A");
    const tampered = parts.join(".");

    expect(() => verifyAuthToken(tampered)).toThrow();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ sub: "user-123" }, process.env.JWT_SECRET as string, {
      algorithm: "HS256",
      expiresIn: -10, // already expired 10 seconds ago
    });

    expect(() => verifyAuthToken(expired)).toThrow();
  });

  it("rejects a token with no sub claim", () => {
    const noSub = jwt.sign({ foo: "bar" }, process.env.JWT_SECRET as string, { algorithm: "HS256" });

    expect(() => verifyAuthToken(noSub)).toThrow();
  });

  it("rejects a token with a non-string sub claim", () => {
    const badSub = jwt.sign({ sub: 12345 }, process.env.JWT_SECRET as string, { algorithm: "HS256" });

    expect(() => verifyAuthToken(badSub)).toThrow();
  });

  it("fails clearly when JWT_SECRET is missing, for signing", () => {
    delete process.env.JWT_SECRET;

    expect(() => signAuthToken("user-123")).toThrow("JWT_SECRET environment variable is not set");
  });

  it("fails clearly when JWT_SECRET is missing, for verifying", () => {
    const token = signAuthToken("user-123");
    delete process.env.JWT_SECRET;

    expect(() => verifyAuthToken(token)).toThrow("JWT_SECRET environment variable is not set");
  });
});
