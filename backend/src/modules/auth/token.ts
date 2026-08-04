import jwt from "jsonwebtoken";

// HMAC only — never accept "none" or an asymmetric algorithm here, which
// would otherwise open the door to classic JWT algorithm-confusion attacks.
const ALGORITHM = "HS256";
const EXPIRES_IN = "24h";

export interface AuthTokenPayload {
  userId: string;
}

// Read fresh on every call rather than cached at module scope, so a missing
// JWT_SECRET fails the moment a token is actually signed/verified (not
// silently at import time, and not silently falling back to a default).
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

// Payload is intentionally minimal — only the user id as `sub`. Never add
// password, email, name, role, or any other user data here: JWTs are not
// encrypted, only signed, so anything in the payload is readable by whoever
// holds the token.
export function signAuthToken(userId: string): string {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("userId is required to sign an auth token");
  }
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    algorithm: ALGORITHM,
    expiresIn: EXPIRES_IN,
  });
}

// Verifies signature + expiry (both via jwt.verify) and that the resulting
// payload has a usable `sub`. Throws a plain Error for every failure mode —
// malformed token, wrong/tampered signature, expired token, or a
// missing/invalid `sub` — deliberately without distinguishing which, so
// callers (e.g. the auth middleware) can map any failure to a single, safe
// "unauthenticated" response instead of leaking why a token was rejected.
export function verifyAuthToken(token: string): AuthTokenPayload {
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new Error("A token is required");
  }

  const secret = getJwtSecret();

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch {
    throw new Error("Invalid or expired auth token");
  }

  if (typeof decoded === "string" || typeof decoded.sub !== "string" || decoded.sub.trim().length === 0) {
    throw new Error("Auth token is missing a valid subject");
  }

  return { userId: decoded.sub };
}
