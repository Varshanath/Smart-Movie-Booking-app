# Smart Movie Booking App

Smart Movie Booking App is organized as a mobile-first system with a Flutter
Android frontend and a backend API.

## Repository Structure

```text
.
+-- frontend/
|   +-- flutter_app/          # Flutter Android client
+-- backend/                  # Backend API and services
+-- docs/                     # Architecture and planning documents
```

New Flutter development should happen inside `frontend/flutter_app/`.

## Frontend

The Flutter client is structured by feature and shared application layers:

- `lib/app/` application bootstrap, routing, and dependency setup
- `lib/core/` shared constants, errors, networking, storage, and utilities
- `lib/features/` user-facing feature modules
- `lib/shared/` reusable widgets and theme code
- `test/` frontend tests

## Backend

The backend is structured around API boundaries and business modules:

- `src/api/` route/controller layer
- `src/config/` environment and application configuration
- `src/modules/` domain modules: `users` (registration, login, change
  password — the only module implemented so far), plus placeholder folders
  for `auth`, `movies`, `theaters`, `bookings`, and `payments`
- `src/shared/` cross-cutting middleware, utilities, and types
- `tests/` backend tests

## Running the App

Backend (from `backend/`):

```bash
npm install
npm run dev
```

Runs on `http://localhost:4000`. See [backend/README.md](backend/README.md)
for the API reference.

Flutter client (from `frontend/flutter_app/`), Android runner already
included:

```bash
flutter pub get
flutter run
```

See [frontend/flutter_app/README.md](frontend/flutter_app/README.md) for
more.

## Known Gaps

See [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md) for what's not implemented yet
(notably: the backend has no real database).
