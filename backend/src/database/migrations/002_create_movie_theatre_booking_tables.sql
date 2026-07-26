CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  genre VARCHAR(80) NOT NULL,
  language VARCHAR(80) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  release_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theatres (
  id UUID PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  location VARCHAR(160) NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  movie_id UUID NOT NULL REFERENCES movies(id),
  theatre_id UUID NOT NULL REFERENCES theatres(id),
  show_time TIMESTAMP NOT NULL,
  seats INTEGER NOT NULL CHECK (seats > 0),
  status VARCHAR(30) NOT NULL CHECK (
    status IN ('confirmed', 'cancelled')
  ),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies (genre);

-- Guarded because migration 005 later drops theatres.location; migrations
-- re-run in full on every boot, so this must stay safe after that happens.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'theatres' AND column_name = 'location'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_theatres_location ON theatres (location);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_movie_id ON bookings (movie_id);
CREATE INDEX IF NOT EXISTS idx_bookings_theatre_id ON bookings (theatre_id);
