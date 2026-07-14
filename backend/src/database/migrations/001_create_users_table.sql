CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  gender VARCHAR(30) NOT NULL CHECK (
    gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  location VARCHAR(160) NOT NULL,
  movie_preference TEXT[] NOT NULL DEFAULT '{}',
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_location ON users (location);
CREATE INDEX idx_users_gender ON users (gender);
