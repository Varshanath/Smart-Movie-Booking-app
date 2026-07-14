# Architecture

## System Overview

The application is split into two primary parts:

- Flutter Android frontend for the customer-facing booking experience.
- Backend API for authentication, movie listings, theater data, seat inventory,
  booking workflows, and payments integration.

## Frontend Responsibilities

- Register and authenticate users.
- Collect profile and movie preferences.
- Browse movies, showtimes, theaters, and seats.
- Create and track bookings.
- Communicate with the backend through API clients in `lib/core/network`.

## Backend Responsibilities

- Expose versioned HTTP APIs.
- Own business rules for movies, showtimes, seat availability, and bookings.
- Persist user, movie, theater, showtime, and booking data.
- Integrate with payment and notification providers when those are added.

## Suggested Module Boundaries

- `auth`: registration, login, token refresh, password reset.
- `users`: user profile, preferences, and account settings.
- `movies`: movie catalog, genres, ratings, and search.
- `theaters`: theater locations, halls, screens, and seats.
- `bookings`: seat locking, booking confirmation, cancellation, and history.
- `payments`: payment session creation, callbacks, and receipts.
