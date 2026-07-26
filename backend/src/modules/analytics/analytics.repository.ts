import { listBookings } from "../bookings/booking.repository";
import { listMovieGenreLinks, listNamedEntities } from "../catalog/catalog.repository";
import { isPostgresEnabled, pool } from "../../database/postgres";
import { listMovies } from "../movies/movie.repository";
import { listPayments } from "../payments/payment.repository";
import { listScreens, listShows } from "../shows/show.repository";
import { listTheatres } from "../theatres/theatre.repository";

export interface MovieBookingStat {
  movieId: string;
  title: string;
  totalBookings: number;
  totalSeatsBooked: number;
}

export interface TheatreBookingStat {
  theatreId: string;
  name: string;
  totalBookings: number;
  totalSeatsBooked: number;
}

export interface GenrePopularityStat {
  genreId: string;
  name: string;
  totalBookings: number;
  totalSeatsBooked: number;
}

export interface DailyRevenueStat {
  revenueDate: string;
  totalBookings: number;
  totalRevenue: number;
}

export interface ShowOccupancyStat {
  showId: string;
  movieId: string;
  screenId: string;
  totalSeats: number;
  seatsBooked: number;
  occupancyPercentage: number;
}

// Only confirmed/completed bookings represent real, honored seat sales;
// cancelled bookings are excluded from every stat below.
const COUNTED_STATUSES = new Set(["confirmed", "completed"]);

export async function getMostBookedMovies(): Promise<MovieBookingStat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT movie_id AS "movieId", title, total_bookings AS "totalBookings", total_seats_booked AS "totalSeatsBooked"
      FROM v_movie_booking_counts
    `);
    return result.rows as MovieBookingStat[];
  }

  const [movies, shows, bookings] = await Promise.all([listMovies(), listShows(), listBookings()]);
  const showById = new Map(shows.map((show) => [show.id, show]));
  const counts = new Map<string, { totalBookings: number; totalSeatsBooked: number }>();

  for (const booking of bookings) {
    if (!COUNTED_STATUSES.has(booking.status)) continue;
    const show = showById.get(booking.showId);
    if (!show) continue;
    const entry = counts.get(show.movieId) ?? { totalBookings: 0, totalSeatsBooked: 0 };
    entry.totalBookings += 1;
    entry.totalSeatsBooked += booking.seats;
    counts.set(show.movieId, entry);
  }

  return movies
    .map((movie) => ({
      movieId: movie.id,
      title: movie.title,
      totalBookings: counts.get(movie.id)?.totalBookings ?? 0,
      totalSeatsBooked: counts.get(movie.id)?.totalSeatsBooked ?? 0,
    }))
    .sort((a, b) => b.totalSeatsBooked - a.totalSeatsBooked);
}

export async function getMostBookedTheatres(): Promise<TheatreBookingStat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT theatre_id AS "theatreId", name, total_bookings AS "totalBookings", total_seats_booked AS "totalSeatsBooked"
      FROM v_theatre_booking_counts
    `);
    return result.rows as TheatreBookingStat[];
  }

  const [theatres, screens, shows, bookings] = await Promise.all([
    listTheatres(),
    listScreens(),
    listShows(),
    listBookings(),
  ]);
  const screenTheatreId = new Map(screens.map((screen) => [screen.id, screen.theatreId]));
  const showTheatreId = new Map(shows.map((show) => [show.id, screenTheatreId.get(show.screenId)]));
  const counts = new Map<string, { totalBookings: number; totalSeatsBooked: number }>();

  for (const booking of bookings) {
    if (!COUNTED_STATUSES.has(booking.status)) continue;
    const theatreId = showTheatreId.get(booking.showId);
    if (!theatreId) continue;
    const entry = counts.get(theatreId) ?? { totalBookings: 0, totalSeatsBooked: 0 };
    entry.totalBookings += 1;
    entry.totalSeatsBooked += booking.seats;
    counts.set(theatreId, entry);
  }

  return theatres
    .map((theatre) => ({
      theatreId: theatre.id,
      name: theatre.name,
      totalBookings: counts.get(theatre.id)?.totalBookings ?? 0,
      totalSeatsBooked: counts.get(theatre.id)?.totalSeatsBooked ?? 0,
    }))
    .sort((a, b) => b.totalSeatsBooked - a.totalSeatsBooked);
}

export async function getPopularGenres(): Promise<GenrePopularityStat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT genre_id AS "genreId", name, total_bookings AS "totalBookings", total_seats_booked AS "totalSeatsBooked"
      FROM v_genre_popularity
    `);
    return result.rows as GenrePopularityStat[];
  }

  const [genres, movieGenreLinks, shows, bookings] = await Promise.all([
    listNamedEntities("genres"),
    listMovieGenreLinks(),
    listShows(),
    listBookings(),
  ]);

  const showMovieId = new Map(shows.map((show) => [show.id, show.movieId]));
  const genreIdsByMovieId = new Map<string, string[]>();
  for (const link of movieGenreLinks) {
    const list = genreIdsByMovieId.get(link.movieId) ?? [];
    list.push(link.genreId);
    genreIdsByMovieId.set(link.movieId, list);
  }

  const counts = new Map<string, { totalBookings: number; totalSeatsBooked: number }>();
  for (const booking of bookings) {
    if (!COUNTED_STATUSES.has(booking.status)) continue;
    const movieId = showMovieId.get(booking.showId);
    if (!movieId) continue;
    for (const genreId of genreIdsByMovieId.get(movieId) ?? []) {
      const entry = counts.get(genreId) ?? { totalBookings: 0, totalSeatsBooked: 0 };
      entry.totalBookings += 1;
      entry.totalSeatsBooked += booking.seats;
      counts.set(genreId, entry);
    }
  }

  return genres
    .map((genre) => ({
      genreId: genre.id,
      name: genre.name,
      totalBookings: counts.get(genre.id)?.totalBookings ?? 0,
      totalSeatsBooked: counts.get(genre.id)?.totalSeatsBooked ?? 0,
    }))
    .sort((a, b) => b.totalSeatsBooked - a.totalSeatsBooked);
}

export async function getDailyRevenue(): Promise<DailyRevenueStat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT revenue_date AS "revenueDate", total_bookings AS "totalBookings", total_revenue AS "totalRevenue"
      FROM v_daily_revenue
    `);
    return result.rows as DailyRevenueStat[];
  }

  const [bookings, payments] = await Promise.all([listBookings(), listPayments()]);
  const paymentById = new Map(payments.map((payment) => [payment.id, payment]));
  const byDate = new Map<string, { totalBookings: number; totalRevenue: number }>();

  for (const booking of bookings) {
    if (!COUNTED_STATUSES.has(booking.status)) continue;
    const payment = paymentById.get(booking.paymentId);
    if (!payment || payment.status !== "paid") continue;
    const dateKey = booking.createdAt.toISOString().slice(0, 10);
    const entry = byDate.get(dateKey) ?? { totalBookings: 0, totalRevenue: 0 };
    entry.totalBookings += 1;
    entry.totalRevenue += payment.amount;
    byDate.set(dateKey, entry);
  }

  return Array.from(byDate.entries())
    .map(([revenueDate, stats]) => ({ revenueDate, ...stats }))
    .sort((a, b) => (a.revenueDate < b.revenueDate ? 1 : -1));
}

export async function getShowOccupancy(): Promise<ShowOccupancyStat[]> {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(`
      SELECT show_id AS "showId", movie_id AS "movieId", screen_id AS "screenId",
             total_seats AS "totalSeats", seats_booked AS "seatsBooked",
             occupancy_percentage AS "occupancyPercentage"
      FROM v_show_occupancy
    `);
    return result.rows as ShowOccupancyStat[];
  }

  const [shows, screens, bookings] = await Promise.all([listShows(), listScreens(), listBookings()]);
  const screenById = new Map(screens.map((screen) => [screen.id, screen]));
  const seatsBookedByShow = new Map<string, number>();
  for (const booking of bookings) {
    if (!COUNTED_STATUSES.has(booking.status)) continue;
    seatsBookedByShow.set(booking.showId, (seatsBookedByShow.get(booking.showId) ?? 0) + booking.seats);
  }

  return shows.map((show) => {
    const screen = screenById.get(show.screenId);
    const totalSeats = screen?.totalSeats ?? 0;
    const seatsBooked = seatsBookedByShow.get(show.id) ?? 0;
    return {
      showId: show.id,
      movieId: show.movieId,
      screenId: show.screenId,
      totalSeats,
      seatsBooked,
      occupancyPercentage: totalSeats > 0 ? Number(((seatsBooked / totalSeats) * 100).toFixed(2)) : 0,
    };
  });
}
