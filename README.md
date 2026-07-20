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
- `src/modules/` domain modules such as auth, movies, bookings, and users
- `src/shared/` cross-cutting middleware, utilities, and types
- `tests/` backend tests

## Next Step

When Flutter is installed, initialize the client inside `frontend/flutter_app`
with:

```bash
flutter create .
```
