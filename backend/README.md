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

## Testing

```bash
npm test
```

## Health Check

```text
GET /health
```

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
  "phoneNumber": "9876543210",
  "password": "password123"
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

## Login API

Endpoint:

```text
POST /api/users/login
```

Request body:

```json
{
  "email": "varsha@test.com",
  "password": "password123"
}
```

Success response: same shape as registration's `user` object, with
`"message": "Login successful"`.

## Change Password API

Endpoint:

```text
POST /api/users/change-password
```

Request body:

```json
{
  "email": "varsha@test.com",
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

Success response: same shape as registration's `user` object, with
`"message": "Password changed successfully"`.

## Notes

- Data is stored in-memory only (`src/modules/users/user.repository.ts`) —
  nothing persists across restarts yet, despite `database/migrations/`
  containing a Postgres schema. See
  [../docs/NEXT_STEPS.md](../docs/NEXT_STEPS.md).
