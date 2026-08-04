// Runs once before each test file. dotenv is intentionally only loaded in
// src/server.ts (see database/postgres.ts's isPostgresEnabled comments) so
// tests default to the in-memory fallback instead of a real DATABASE_URL —
// JWT_SECRET needs the same "present for tests, real value in production"
// treatment: login/register now sign a token on every call, so every test
// touching those routes needs *some* secret available. Individual test
// files (auth-token.test.ts, authenticate-middleware.test.ts) still
// override this locally when they need to test specific secret values or
// a missing-secret case, restoring it afterward.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";
}
