# Next Steps / Known Gaps

Snapshot from a full structure audit + live runs of the backend and the
Flutter app (including on an Android emulator), most recently updated
2026-07-23. Kept here so the context isn't lost between sessions — update
or trim entries as they're fixed.

## 1. Frontend patron app has no way to create movies/theatres/shows

The Flutter app is patron-only by design (see git history) — no admin UI
exists for creating movies, theatres, screens, or shows. Demo/dev data is
populated via `backend/src/database/seeders/seed-demo-data.ts` (run with
`npm run seed` against a running backend). If the seeded data is ever
wiped (e.g. a fresh database), re-run the seed script before testing the
app, or nothing will show up in "Now Showing".

## Already resolved

- **Backend now uses real Postgres persistence, in both local dev and
  production.** Wired `backend/.env`'s `DATABASE_URL` to the project's
  Render Postgres instance. Fixed two bugs found while wiring it up:
  - `runMigrations()` in `backend/src/database/postgres.ts` pointed at
    `src/database` instead of `src/database/migrations`, so it silently
    found zero `.sql` files and never actually ran any migration.
  - No SSL config on the `pg.Pool` — Render Postgres requires SSL for
    external connections; added `ssl: { rejectUnauthorized: false }` for
    any non-localhost `DATABASE_URL`.
  Verified with a real persistence test: registered a user, fully
  restarted the backend process, and confirmed the user (and a booking)
  survived — proving it's reading/writing Postgres, not the in-memory
  fallback. Also confirmed the **deployed** backend
  (`https://smart-movie-booking-app.onrender.com`) already points at this
  same Postgres instance — a booking created locally showed up via the
  live API with an identical ID, so production and local dev currently
  share one database. `backend/tests/` still safely run against the
  in-memory store (they call `createApp` directly, which doesn't load
  `.env`), so tests never touch the real database.
- Removed the stale native Kotlin/Compose Android app (`app/`) and its
  root Gradle toolchain — it had drifted out of sync with the backend
  (missing `phoneNumber` on register, no `change-password` call) while
  `frontend/flutter_app/` was the fully-wired client. `README.md` and
  `.gitignore` were updated to match.
- Fixed the Flutter widget test suite (was 8/11 passing, now 11/11). The
  registration form overflowed the default test surface, so `tester.tap()`
  on the "Register"/"Back to login" buttons missed silently. Added
  `tester.ensureVisible(...)` before each tap in
  `frontend/flutter_app/test/auth_flow_test.dart`.
- Committed the Android platform scaffold
  (`flutter create --platforms=android ...`) so the app builds/runs on
  Android without regenerating it each time.
- Fixed the deprecated `DropdownButtonFormField.value` → `initialValue`.
- Added a seat-grid + pricing model to the backend (`Screen.rows` /
  `seatsPerRow`, `Show.price`, `Booking.seatNumbers[]` with conflict
  validation) and a new `GET /api/shows/:showId/seats` endpoint.
- Rebuilt the Flutter app from an internal API-testing dashboard into a
  real patron booking flow: browse movies → movie detail/showtimes →
  tappable seat grid → pay → booking confirmation → My Bookings.
