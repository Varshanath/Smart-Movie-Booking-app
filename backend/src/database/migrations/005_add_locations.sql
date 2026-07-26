CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE theatres ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- One-time backfill: turn the old free-text theatres.location column into
-- rows in `locations` + a location_id FK, then drop the text column. Guarded
-- so it's a no-op on every later startup (migrations re-run every boot).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'theatres' AND column_name = 'location'
  ) THEN
    INSERT INTO locations (id, name)
    SELECT gen_random_uuid(), existing.location_name
    FROM (
      SELECT DISTINCT location AS location_name FROM theatres WHERE location IS NOT NULL
    ) AS existing
    ON CONFLICT (name) DO NOTHING;

    UPDATE theatres t
    SET location_id = l.id
    FROM locations l
    WHERE t.location_id IS NULL AND t.location = l.name;

    ALTER TABLE theatres ALTER COLUMN location_id SET NOT NULL;

    DROP INDEX IF EXISTS idx_theatres_location;
    ALTER TABLE theatres DROP COLUMN location;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_theatres_location_id ON theatres (location_id);
