CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  gender VARCHAR(30) NOT NULL CHECK (
    gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  location VARCHAR(160) NOT NULL,
  movie_preference TEXT[] NOT NULL DEFAULT '{}',
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_location ON users (location);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users (gender);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT 'legacy-password-not-set';

ALTER TABLE users
  ALTER COLUMN password_hash DROP DEFAULT;
