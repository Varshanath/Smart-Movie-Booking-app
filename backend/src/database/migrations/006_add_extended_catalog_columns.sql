-- Extends existing tables with the richer catalog fields needed for a
-- realistic demo dataset (posters, certificates, theatre geo/facilities,
-- screen types, and payment/booking metadata). All additive and nullable
-- (or defaulted) so existing rows and app code keep working unchanged.

ALTER TABLE movies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS certificate VARCHAR(10);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) NOT NULL DEFAULT 0;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS director VARCHAR(140);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS producer VARCHAR(140);

ALTER TABLE theatres ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE theatres ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
ALTER TABLE theatres ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE theatres ADD COLUMN IF NOT EXISTS facilities TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE screens ADD COLUMN IF NOT EXISTS screen_type VARCHAR(20) NOT NULL DEFAULT 'Standard';

ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(30);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount INTEGER;

-- `name`/`phone_number` already cover the spec's first/last name and mobile
-- fields; kept as-is rather than reshaping the live registration flow.
ALTER TABLE users ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES locations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(60);

-- Widen booking status to include a terminal "completed" state (show has
-- already aired) alongside the existing confirmed/cancelled values.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'completed'));

CREATE INDEX IF NOT EXISTS idx_users_city_id ON users (city_id);
