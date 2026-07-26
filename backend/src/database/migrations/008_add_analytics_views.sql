-- Analytics are derived from real booking/payment data rather than seeded
-- as independent facts (which could drift from what was actually booked).
-- These views compute "most booked movies/theatres", "popular genres",
-- revenue, and per-show occupancy on demand.

CREATE OR REPLACE VIEW v_movie_booking_counts AS
SELECT
  m.id AS movie_id,
  m.title,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.seats), 0) AS total_seats_booked
FROM movies m
LEFT JOIN shows s ON s.movie_id = m.id
LEFT JOIN bookings b ON b.show_id = s.id AND b.status IN ('confirmed', 'completed')
GROUP BY m.id, m.title
ORDER BY total_seats_booked DESC;

CREATE OR REPLACE VIEW v_theatre_booking_counts AS
SELECT
  t.id AS theatre_id,
  t.name,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.seats), 0) AS total_seats_booked
FROM theatres t
LEFT JOIN screens sc ON sc.theatre_id = t.id
LEFT JOIN shows s ON s.screen_id = sc.id
LEFT JOIN bookings b ON b.show_id = s.id AND b.status IN ('confirmed', 'completed')
GROUP BY t.id, t.name
ORDER BY total_seats_booked DESC;

CREATE OR REPLACE VIEW v_genre_popularity AS
SELECT
  g.id AS genre_id,
  g.name,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.seats), 0) AS total_seats_booked
FROM genres g
LEFT JOIN movie_genres mg ON mg.genre_id = g.id
LEFT JOIN shows s ON s.movie_id = mg.movie_id
LEFT JOIN bookings b ON b.show_id = s.id AND b.status IN ('confirmed', 'completed')
GROUP BY g.id, g.name
ORDER BY total_seats_booked DESC;

CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  DATE_TRUNC('day', b.created_at) AS revenue_date,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(p.amount), 0) AS total_revenue
FROM bookings b
JOIN payments p ON p.id = b.payment_id
WHERE b.status IN ('confirmed', 'completed') AND p.status = 'paid'
GROUP BY DATE_TRUNC('day', b.created_at)
ORDER BY revenue_date DESC;

CREATE OR REPLACE VIEW v_show_occupancy AS
SELECT
  s.id AS show_id,
  s.movie_id,
  s.screen_id,
  sc.total_seats,
  COALESCE(SUM(b.seats), 0) AS seats_booked,
  ROUND(
    (COALESCE(SUM(b.seats), 0)::NUMERIC / NULLIF(sc.total_seats, 0)) * 100,
    2
  ) AS occupancy_percentage
FROM shows s
JOIN screens sc ON sc.id = s.screen_id
LEFT JOIN bookings b ON b.show_id = s.id AND b.status IN ('confirmed', 'completed')
GROUP BY s.id, s.movie_id, s.screen_id, sc.total_seats;
