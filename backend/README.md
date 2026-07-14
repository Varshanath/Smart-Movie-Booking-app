# Backend

Backend API for the Smart Movie Booking App.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default.

## User Registration API

Endpoint:

```text
POST /api/users/register
```

Request body:

```json
{
  "name": "Varsha Nath",
  "gender": "female",
  "location": "Bengaluru",
  "moviePreference": ["Action", "Comedy"],
  "email": "varsha@test.com",
  "phoneNumber": "9876543210"
}
```

Success response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "generated-user-id",
    "name": "Varsha Nath",
    "gender": "female",
    "location": "Bengaluru",
    "moviePreference": ["Action", "Comedy"],
    "email": "varsha@test.com",
    "phoneNumber": "9876543210",
    "createdAt": "2026-07-14T00:00:00.000Z",
    "updatedAt": "2026-07-14T00:00:00.000Z"
  }
}
```
