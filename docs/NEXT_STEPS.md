# Next Steps / Known Gaps

Snapshot from a full structure audit + live run of the backend and the
Flutter app (including on an Android emulator) on 2026-07-20. Kept here so
the context isn't lost between sessions — update or trim entries as they're
fixed.

## 1. Backend has no real database (highest priority)

`backend/src/modules/users/user.repository.ts` stores everything in an
in-memory `Map`. Every registered user is wiped on server restart.

- `package.json` has no DB client (`pg`, `knex`, `prisma`, etc.) at all.
- `src/config/` is empty (just `.gitkeep`) — no connection/pool setup exists.
- `DATABASE_URL` is declared in `.env.example` but never read anywhere in `src/`.
- `backend/src/database/migrations/001_create_users_table.sql` defines a
  Postgres `users` table that nothing actually applies or connects to — it's
  decorative right now.
- Practical impact: the deployed Render backend
  (`https://smart-movie-booking-app.onrender.com`) is on the free tier,
  which sleeps/restarts, so production users are not durable either.

**Fix:** wire a real Postgres connection (e.g. `pg` or an ORM) in
`src/config/`, run the existing migration against it, and swap
`user.repository.ts` from the `Map` to real queries.

## 2. Backend only implements auth; other modules are stubs

`movies`, `theaters`, `bookings`, `payments` under `backend/src/modules/`
are empty `.gitkeep` placeholders. This matches the roadmap in
`docs/ARCHITECTURE.md`'s "Suggested Module Boundaries" — not a bug, just
unbuilt. Only `users` (register/login/change-password) is implemented and
verified working end-to-end (backend tests, curl smoke test, and a live
Android emulator run all pass against it).

## Already resolved this session

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
- Committed (staged) the Android platform scaffold. Ran
  `flutter create --platforms=android --project-name smart_movie_booking_app .`
  inside `frontend/flutter_app/` to add `android/`, `.metadata`, and a
  Flutter-standard `.gitignore`, so the app can build/run on Android without
  regenerating the scaffold each time. `android/local.properties`
  (machine-specific SDK path) stays gitignored as usual.
- Fixed the deprecated `DropdownButtonFormField.value` → `initialValue` in
  `frontend/flutter_app/lib/features/auth/register_page.dart`. `flutter
  analyze` now reports no issues.
