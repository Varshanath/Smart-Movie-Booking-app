/**
 * Populates a Postgres database with a large, realistic demo dataset:
 * cities, users, genres, movies, theatres, screens, seats, shows, bookings,
 * payments, reviews, watchlists, recommendations, notifications, coupons,
 * AI chat history, and search history.
 *
 * This script TRUNCATEs and rebuilds a large slice of the schema. Against a
 * local database it just runs; against anything else (see
 * `assertDatabaseTargetIsIntentional`) it refuses unless SEED_CONFIRM_REMOTE
 * is explicitly set, since that means destroying whatever is currently there.
 *
 * Run against a local database, e.g.:
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/smart_movie_booking npm run seed:full
 *
 * Run against a remote/hosted database (back it up first!):
 *   DATABASE_URL=<remote-url> SEED_CONFIRM_REMOTE=yes-destroy-this-database npm run seed:full
 */

import "dotenv/config";
import { randomBytes, randomUUID, scryptSync } from "crypto";

import { faker } from "@faker-js/faker";
import { Pool, PoolClient } from "pg";

// ---------------------------------------------------------------------------
// Config / constants
// ---------------------------------------------------------------------------

const TARGET = {
  users: 100,
  movies: 75,
  theatres: 25,
  screensPerTheatre: 4, // 25 * 4 = 100 screens
  rows: 12, // A-L
  seatsPerRow: 20, // 1-20 -> 100 screens * 240 seats = 24,000 seats
  showDays: 10,
  bookings: 500,
  reviews: 300,
  actorsPoolSize: 150,
};

const CITY_NAMES = [
  "Kolkata",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Jaipur",
];

const GENRE_NAMES = [
  "Action",
  "Comedy",
  "Drama",
  "Thriller",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Adventure",
  "Animation",
  "Horror",
  "Crime",
  "Mystery",
  "Biography",
  "Family",
  "Musical",
];

// Each language is tagged with the "region" used to flavor generated movie
// titles (Hollywood / Bollywood / Regional), per the requested movie mix.
const LANGUAGES = [
  { name: "English", region: "hollywood" },
  { name: "Hindi", region: "bollywood" },
  { name: "Tamil", region: "regional" },
  { name: "Telugu", region: "regional" },
  { name: "Kannada", region: "regional" },
  { name: "Malayalam", region: "regional" },
  { name: "Bengali", region: "regional" },
] as const;

const FACILITIES = [
  "IMAX",
  "Dolby Atmos",
  "Recliner Seats",
  "Food Court",
  "Parking",
  "Wheelchair Accessible",
];

const SCREEN_TYPES = ["Standard", "IMAX", "3D", "4DX"];
const SEAT_TYPES = ["Regular", "Premium", "Recliner"] as const;
const THEATRE_CHAINS = ["PVR", "INOX", "Cinepolis", "Miraj Cinemas", "Carnival", "SPI Cinemas"];

const CERTIFICATES = ["U", "UA", "A"];

const COUPON_SPECS = [
  { code: "WELCOME100", description: "Flat Rs.100 off your first booking", discountType: "flat", discountValue: 100 },
  { code: "MOVIE50", description: "Flat Rs.50 off any movie booking", discountType: "flat", discountValue: 50 },
  { code: "WEEKEND20", description: "20% off weekend shows", discountType: "percentage", discountValue: 20 },
  { code: "FAMILY100", description: "Flat Rs.100 off family bookings (4+ seats)", discountType: "flat", discountValue: 100 },
] as const;

const NOTIFICATION_TEMPLATES: Array<{ type: string; title: string; message: (ctx: { movie: string }) => string }> = [
  { type: "booking_confirmed", title: "Booking confirmed", message: (ctx) => `Your tickets for ${ctx.movie} are confirmed. Enjoy the show!` },
  { type: "movie_released", title: "Now showing", message: (ctx) => `${ctx.movie} just released in theatres near you.` },
  { type: "booking_reminder", title: "Showtime reminder", message: (ctx) => `Reminder: your show for ${ctx.movie} starts soon.` },
  { type: "offer", title: "Special offer", message: () => `Use code WEEKEND20 for 20% off your next booking.` },
];

const CHAT_PROMPT_TEMPLATES: Array<(ctx: { movie: string; genre: string }) => string> = [
  (ctx) => `Recommend a ${ctx.genre.toLowerCase()} movie.`,
  (ctx) => `Book 2 tickets for ${ctx.movie}.`,
  (ctx) => `Any movies like ${ctx.movie}?`,
  () => `What are the IMAX shows tomorrow?`,
  (ctx) => `Is ${ctx.movie} good for kids?`,
  () => `Show me the cheapest tickets this weekend.`,
];

const CHAT_RESPONSE_TEMPLATES: Array<(ctx: { movie: string; genre: string }) => string> = [
  (ctx) => `Here are a few top-rated ${ctx.genre.toLowerCase()} picks you might enjoy.`,
  (ctx) => `I've found 2 seats for ${ctx.movie} at your nearest theatre.`,
  (ctx) => `If you liked ${ctx.movie}, you'll probably enjoy these similar titles.`,
  () => `Here are tomorrow's IMAX showtimes at theatres near you.`,
  (ctx) => `${ctx.movie} is rated for general audiences and is family-friendly.`,
  () => `Here are the lowest-priced shows available this weekend.`,
];

const SEARCH_TERMS = ["Batman", "Marvel", "Romantic movies", "Action movies", "IMAX", "Horror", "New releases", "Comedy"];

// ---------------------------------------------------------------------------
// Safety guard
// ---------------------------------------------------------------------------

const REMOTE_CONFIRMATION_VALUE = "yes-destroy-this-database";

function assertDatabaseTargetIsIntentional(connectionString: string | undefined) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Point it at the Postgres instance you intend to seed.");
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  if (isLocal) {
    return;
  }

  if (process.env.SEED_CONFIRM_REMOTE !== REMOTE_CONFIRMATION_VALUE) {
    throw new Error(
      "Refusing to run: DATABASE_URL points at a remote/hosted database, and this script TRUNCATEs and " +
        "rebuilds most of the schema (all existing users, movies, theatres, bookings, etc. will be lost). " +
        "Back up the database first. If you have done so and definitely want to proceed, re-run with " +
        `SEED_CONFIRM_REMOTE=${REMOTE_CONFIRMATION_VALUE} set.`,
    );
  }

  console.warn("SEED_CONFIRM_REMOTE is set - proceeding to TRUNCATE and reseed a REMOTE database.");
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomItems<T>(items: readonly T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function pastDateWithinYear(): Date {
  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * oneYearMs);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Bulk multi-row INSERT, chunked to stay well under Postgres' parameter limit. */
async function bulkInsert(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][],
  batchSize = 500,
) {
  if (rows.length === 0) return;

  for (const batch of chunk(rows, batchSize)) {
    const values: unknown[] = [];
    const tuples = batch.map((row, rowIndex) => {
      const placeholders = row.map((_, colIndex) => `$${rowIndex * row.length + colIndex + 1}`);
      values.push(...row);
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
      values,
    );
  }
}

// ---------------------------------------------------------------------------
// Truncate (idempotent re-seed)
// ---------------------------------------------------------------------------

async function truncateAll(client: PoolClient) {
  console.log("Clearing existing data...");
  await client.query(`
    TRUNCATE TABLE
      search_history, ai_chat_messages, notifications, recommendations, watchlists,
      reviews, seats, bookings, payments, shows, screens, theatres,
      movie_cast, movie_genres, watch_history, user_preferences,
      movies, users, coupons, genres, actors, languages, locations
    RESTART IDENTITY CASCADE
  `);
}

// ---------------------------------------------------------------------------
// Lookup tables: cities, genres, languages, actors, coupons
// ---------------------------------------------------------------------------

async function seedLocations(client: PoolClient) {
  console.log(`Seeding ${CITY_NAMES.length} cities...`);
  const rows = CITY_NAMES.map((name) => ({ id: randomUUID(), name }));
  await bulkInsert(
    client,
    "locations",
    ["id", "name"],
    rows.map((row) => [row.id, row.name]),
  );
  return rows;
}

async function seedGenres(client: PoolClient) {
  console.log(`Seeding ${GENRE_NAMES.length} genres...`);
  const rows = GENRE_NAMES.map((name) => ({ id: randomUUID(), name }));
  await bulkInsert(
    client,
    "genres",
    ["id", "name"],
    rows.map((row) => [row.id, row.name]),
  );
  return rows;
}

async function seedLanguages(client: PoolClient) {
  console.log(`Seeding ${LANGUAGES.length} languages...`);
  const rows = LANGUAGES.map((language) => ({ id: randomUUID(), ...language }));
  await bulkInsert(
    client,
    "languages",
    ["id", "name"],
    rows.map((row) => [row.id, row.name]),
  );
  return rows;
}

async function seedActors(client: PoolClient, count: number) {
  console.log(`Seeding ${count} actors...`);
  const names = new Set<string>();
  while (names.size < count) {
    names.add(faker.person.fullName());
  }
  const rows = Array.from(names).map((name) => ({ id: randomUUID(), name }));
  await bulkInsert(
    client,
    "actors",
    ["id", "name"],
    rows.map((row) => [row.id, row.name]),
  );
  return rows;
}

async function seedCoupons(client: PoolClient) {
  console.log(`Seeding ${COUPON_SPECS.length} coupons...`);
  const rows = COUPON_SPECS.map((spec) => ({
    id: randomUUID(),
    ...spec,
    expiresAt: faker.date.soon({ days: 180 }),
  }));
  await bulkInsert(
    client,
    "coupons",
    ["id", "code", "description", "discount_type", "discount_value", "active", "expires_at", "created_at"],
    rows.map((row) => [row.id, row.code, row.description, row.discountType, row.discountValue, true, row.expiresAt, new Date()]),
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

interface SeededUser {
  id: string;
  name: string;
  email: string;
  cityId: string;
}

async function seedUsers(client: PoolClient, locations: Array<{ id: string }>): Promise<SeededUser[]> {
  console.log(`Seeding ${TARGET.users} users...`);
  const passwordHash = hashPassword("Password123!");
  const genders = ["male", "female", "other", "prefer_not_to_say"];

  const users = Array.from({ length: TARGET.users }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      id: randomUUID(),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      cityId: randomItem(locations).id,
      gender: randomItem(genders),
      phoneNumber: faker.phone.number({ style: "national" }).replace(/\D/g, "").slice(-10).padStart(10, "9"),
      moviePreference: randomItems(GENRE_NAMES, randomInt(1, 3)),
      profileImage: faker.image.avatarGitHub(),
      preferredLanguage: randomItem(LANGUAGES).name,
      createdAt: pastDateWithinYear(),
    };
  });

  await bulkInsert(
    client,
    "users",
    [
      "id", "name", "gender", "location", "movie_preference", "email", "phone_number",
      "password_hash", "created_at", "updated_at", "city_id", "profile_image", "preferred_language",
    ],
    users.map((user) => [
      user.id, user.name, user.gender, "", user.moviePreference, user.email, user.phoneNumber,
      passwordHash, user.createdAt, user.createdAt, user.cityId, user.profileImage, user.preferredLanguage,
    ]),
  );

  // Backfill each user's free-text `location` from their assigned city name.
  await client.query(
    `UPDATE users SET location = l.name FROM locations l WHERE users.city_id = l.id`,
  );

  return users.map(({ id, name, email, cityId }) => ({ id, name, email, cityId }));
}

// ---------------------------------------------------------------------------
// Movies (+ genre / cast joins)
// ---------------------------------------------------------------------------

interface SeededMovie {
  id: string;
  title: string;
  releaseDate: Date;
  isReleased: boolean;
  genreIds: string[];
}

const TITLE_ADJECTIVES = ["Last", "Silent", "Golden", "Broken", "Hidden", "Final", "Lost", "Eternal", "Midnight", "Forgotten"];
const TITLE_NOUNS = ["Horizon", "Legacy", "Kingdom", "Shadow", "Journey", "Storm", "Promise", "Warrior", "Symphony", "Odyssey"];

function generateMovieTitle(region: string): string {
  const pattern = randomInt(0, 2);
  if (region === "bollywood" && pattern === 0) {
    return `${faker.person.firstName()} Ki Kahani`;
  }
  if (pattern === 0) {
    return `The ${randomItem(TITLE_ADJECTIVES)} ${randomItem(TITLE_NOUNS)}`;
  }
  if (pattern === 1) {
    return `${randomItem(TITLE_NOUNS)} of ${faker.location.city()}`;
  }
  return `${randomItem(TITLE_ADJECTIVES)} ${randomItem(TITLE_NOUNS)}`;
}

async function seedMovies(
  client: PoolClient,
  genres: Array<{ id: string; name: string }>,
  languages: Array<{ id: string; name: string; region: string }>,
  actors: Array<{ id: string; name: string }>,
): Promise<SeededMovie[]> {
  console.log(`Seeding ${TARGET.movies} movies...`);
  const releasedCount = Math.round(TARGET.movies * 0.75);

  const movies = Array.from({ length: TARGET.movies }, (_, index) => {
    const language = randomItem(languages);
    const isReleased = index < releasedCount;
    const releaseDate = isReleased
      ? faker.date.past({ years: 2 })
      : faker.date.soon({ days: 60 });
    const slug = faker.string.alphanumeric(10).toLowerCase();

    return {
      id: randomUUID(),
      title: generateMovieTitle(language.region),
      genre: randomItem(genres).name, // legacy single-genre text column
      languageId: language.id,
      languageName: language.name,
      durationMinutes: randomInt(95, 175),
      releaseDate,
      isReleased,
      description: faker.lorem.paragraph({ min: 2, max: 4 }),
      certificate: randomItem(CERTIFICATES),
      posterUrl: `https://picsum.photos/seed/${slug}-poster/400/600`,
      backdropUrl: `https://picsum.photos/seed/${slug}-backdrop/1280/720`,
      trailerUrl: `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
      rating: Number((Math.random() * 4 + 5).toFixed(1)), // 5.0 - 9.0
      director: faker.person.fullName(),
      producer: faker.person.fullName(),
      genreIds: randomItems(genres, randomInt(1, 3)).map((g) => g.id),
      castIds: randomItems(actors, randomInt(3, 6)).map((a) => a.id),
    };
  });

  await bulkInsert(
    client,
    "movies",
    [
      "id", "title", "genre", "language", "duration_minutes", "release_date", "created_at", "updated_at",
      "language_id", "description", "certificate", "poster_url", "backdrop_url", "trailer_url", "rating",
      "director", "producer",
    ],
    movies.map((movie) => [
      movie.id, movie.title, movie.genre, movie.languageName, movie.durationMinutes,
      movie.releaseDate.toISOString().slice(0, 10), pastDateWithinYear(), new Date(),
      movie.languageId, movie.description, movie.certificate, movie.posterUrl, movie.backdropUrl,
      movie.trailerUrl, movie.rating, movie.director, movie.producer,
    ]),
  );

  const movieGenreRows = movies.flatMap((movie) => movie.genreIds.map((genreId) => [movie.id, genreId]));
  await bulkInsert(client, "movie_genres", ["movie_id", "genre_id"], movieGenreRows);

  const movieCastRows = movies.flatMap((movie) =>
    movie.castIds.map((actorId) => [movie.id, actorId, faker.person.jobTitle()]),
  );
  await bulkInsert(client, "movie_cast", ["movie_id", "actor_id", "role_name"], movieCastRows);

  return movies.map(({ id, title, releaseDate, isReleased, genreIds }) => ({
    id, title, releaseDate, isReleased, genreIds,
  }));
}

// ---------------------------------------------------------------------------
// Theatres, screens, seats
// ---------------------------------------------------------------------------

interface SeededTheatre {
  id: string;
}

interface SeededScreen {
  id: string;
  theatreId: string;
  screenType: string;
}

async function seedTheatres(client: PoolClient, locations: Array<{ id: string; name: string }>): Promise<SeededTheatre[]> {
  console.log(`Seeding ${TARGET.theatres} theatres...`);
  const totalSeats = TARGET.screensPerTheatre * TARGET.rows * TARGET.seatsPerRow;

  const theatres = Array.from({ length: TARGET.theatres }, () => {
    const city = randomItem(locations);
    return {
      id: randomUUID(),
      name: `${randomItem(THEATRE_CHAINS)} ${faker.company.name().split(" ")[0]} ${randomItem(["Mall", "Cineplex", "Multiplex"])}`,
      locationId: city.id,
      latitude: Number(faker.location.latitude({ min: 8, max: 34 }).toFixed(6)),
      longitude: Number(faker.location.longitude({ min: 70, max: 88 }).toFixed(6)),
      address: `${faker.location.streetAddress()}, ${city.name}`,
      facilities: randomItems(FACILITIES, randomInt(3, FACILITIES.length)),
      totalSeats,
    };
  });

  await bulkInsert(
    client,
    "theatres",
    ["id", "name", "location_id", "total_seats", "created_at", "updated_at", "latitude", "longitude", "address", "facilities"],
    theatres.map((theatre) => [
      theatre.id, theatre.name, theatre.locationId, theatre.totalSeats, pastDateWithinYear(), new Date(),
      theatre.latitude, theatre.longitude, theatre.address, theatre.facilities,
    ]),
  );

  return theatres.map(({ id }) => ({ id }));
}

async function seedScreensAndSeats(client: PoolClient, theatres: SeededTheatre[]) {
  console.log(`Seeding ${theatres.length * TARGET.screensPerTheatre} screens...`);
  const totalSeatsPerScreen = TARGET.rows * TARGET.seatsPerRow;

  const screens = theatres.flatMap((theatre) =>
    Array.from({ length: TARGET.screensPerTheatre }, (_, index) => ({
      id: randomUUID(),
      theatreId: theatre.id,
      name: `Screen ${index + 1}`,
      screenType: randomItem(SCREEN_TYPES),
    })),
  );

  await bulkInsert(
    client,
    "screens",
    ["id", "theatre_id", "name", "rows", "seats_per_row", "total_seats", "created_at", "updated_at", "screen_type"],
    screens.map((screen) => [
      screen.id, screen.theatreId, screen.name, TARGET.rows, TARGET.seatsPerRow, totalSeatsPerScreen,
      pastDateWithinYear(), new Date(), screen.screenType,
    ]),
  );

  console.log(`Seeding ${screens.length * totalSeatsPerScreen} seats...`);
  const seatLabelsByScreen = new Map<string, string[]>();
  const seatRows: unknown[][] = [];

  for (const screen of screens) {
    const labels: string[] = [];
    for (let rowIndex = 0; rowIndex < TARGET.rows; rowIndex += 1) {
      const rowLabel = String.fromCharCode(65 + rowIndex); // A-L
      const seatType: (typeof SEAT_TYPES)[number] =
        rowIndex < 2 ? "Premium" : rowIndex >= TARGET.rows - 2 ? "Recliner" : "Regular";
      for (let seatNumber = 1; seatNumber <= TARGET.seatsPerRow; seatNumber += 1) {
        labels.push(`${rowLabel}${seatNumber}`);
        seatRows.push([randomUUID(), screen.id, rowLabel, seatNumber, seatType, pastDateWithinYear()]);
      }
    }
    seatLabelsByScreen.set(screen.id, labels);
  }

  await bulkInsert(client, "seats", ["id", "screen_id", "row_label", "seat_number", "seat_type", "created_at"], seatRows);

  return { screens, seatLabelsByScreen };
}

// ---------------------------------------------------------------------------
// Shows
// ---------------------------------------------------------------------------

interface SeededShow {
  id: string;
  movieId: string;
  screenId: string;
  startTime: Date;
  price: number;
}

const SHOW_TIME_SLOTS = [9.5, 12.5, 15.5, 18.5, 21.5, 22.75];

function priceForScreenType(screenType: string): number {
  const base: Record<string, [number, number]> = {
    Standard: [150, 250],
    "3D": [200, 320],
    IMAX: [350, 500],
    "4DX": [400, 550],
  };
  const [min, max] = base[screenType] ?? base.Standard;
  return randomInt(min, max);
}

async function seedShows(client: PoolClient, movies: SeededMovie[], screens: SeededScreen[]): Promise<SeededShow[]> {
  const releasedMovies = movies.filter((movie) => movie.isReleased);
  console.log(`Seeding shows across ${screens.length} screens for the next ${TARGET.showDays} days...`);

  const shows: SeededShow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const screen of screens) {
    for (let day = 0; day < TARGET.showDays; day += 1) {
      const slotsToday = randomItems(SHOW_TIME_SLOTS, randomInt(4, 6));
      for (const slot of slotsToday) {
        const startTime = new Date(today);
        startTime.setDate(startTime.getDate() + day);
        startTime.setMinutes(Math.round(slot * 60));

        shows.push({
          id: randomUUID(),
          movieId: randomItem(releasedMovies).id,
          screenId: screen.id,
          startTime,
          price: priceForScreenType(screen.screenType),
        });
      }
    }
  }

  console.log(`Generated ${shows.length} shows.`);
  await bulkInsert(
    client,
    "shows",
    ["id", "movie_id", "screen_id", "start_time", "price", "created_at", "updated_at"],
    shows.map((show) => [show.id, show.movieId, show.screenId, show.startTime, show.price, new Date(), new Date()]),
  );

  return shows;
}

// ---------------------------------------------------------------------------
// Bookings + payments
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"];

async function seedBookingsAndPayments(
  client: PoolClient,
  users: SeededUser[],
  shows: SeededShow[],
  screenById: Map<string, SeededScreen>,
  seatLabelsByScreen: Map<string, string[]>,
  coupons: Array<{ id: string }>,
) {
  console.log(`Seeding ${TARGET.bookings} bookings and payments...`);
  const now = new Date();
  const bookedSeatsByShow = new Map<string, Set<string>>();

  // Guarantee every user has at least one booking, then fill the remainder randomly.
  const bookingUserOrder = [
    ...users,
    ...Array.from({ length: TARGET.bookings - users.length }, () => randomItem(users)),
  ];

  const bookings: unknown[][] = [];
  const payments: unknown[][] = [];

  for (const user of bookingUserOrder) {
    const show = randomItem(shows);
    const screen = screenById.get(show.screenId);
    if (!screen) continue;

    const availableSeats = (seatLabelsByScreen.get(show.screenId) ?? []).filter(
      (label) => !bookedSeatsByShow.get(show.id)?.has(label),
    );
    if (availableSeats.length === 0) continue;

    const seatCount = Math.min(randomInt(1, 4), availableSeats.length);
    const seatNumbers = randomItems(availableSeats, seatCount);
    const bookedSet = bookedSeatsByShow.get(show.id) ?? new Set<string>();
    seatNumbers.forEach((seat) => bookedSet.add(seat));
    bookedSeatsByShow.set(show.id, bookedSet);

    const isCancelled = Math.random() < 0.1;
    const isPast = show.startTime.getTime() < now.getTime();
    const bookingStatus = isCancelled ? "cancelled" : isPast ? "completed" : "confirmed";
    const amount = seatNumbers.length * show.price;

    const paymentId = randomUUID();
    const paymentStatus = isCancelled ? (Math.random() < 0.7 ? "refunded" : "failed") : "paid";
    const method = randomItem(PAYMENT_METHODS);
    const createdAt = pastDateWithinYear();

    payments.push([paymentId, amount, paymentStatus, `pay_${faker.string.alphanumeric(12)}`, createdAt, createdAt, method]);

    const bookingId = randomUUID();
    const couponId = Math.random() < 0.15 ? randomItem(coupons).id : null;
    bookings.push([
      bookingId, user.id, show.movieId, null, null, seatNumbers.length, bookingStatus,
      createdAt, createdAt, show.id, paymentId, seatNumbers, amount, couponId,
    ]);
  }

  await bulkInsert(
    client,
    "payments",
    ["id", "amount", "status", "provider_reference", "created_at", "updated_at", "method"],
    payments,
  );

  await bulkInsert(
    client,
    "bookings",
    [
      "id", "user_id", "movie_id", "theatre_id", "show_time", "seats", "status",
      "created_at", "updated_at", "show_id", "payment_id", "seat_numbers", "amount", "coupon_id",
    ],
    bookings,
  );

  console.log(`Generated ${bookings.length} bookings and ${payments.length} payments.`);
}

// ---------------------------------------------------------------------------
// Reviews, watchlists, watch history, favourite genres
// ---------------------------------------------------------------------------

async function seedReviews(client: PoolClient, users: SeededUser[], movies: SeededMovie[]) {
  console.log(`Seeding ${TARGET.reviews} reviews...`);
  const seen = new Set<string>();
  const rows: unknown[][] = [];

  while (rows.length < TARGET.reviews) {
    const user = randomItem(users);
    const movie = randomItem(movies);
    const key = `${user.id}:${movie.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push([
      randomUUID(), user.id, movie.id, Number((Math.random() * 4 + 1).toFixed(1)),
      faker.lorem.sentences({ min: 1, max: 3 }), pastDateWithinYear(),
    ]);
  }

  await bulkInsert(client, "reviews", ["id", "user_id", "movie_id", "rating", "review_text", "created_at"], rows);
}

async function seedWatchlists(client: PoolClient, users: SeededUser[], movies: SeededMovie[]) {
  console.log("Seeding watchlists...");
  const rows: unknown[][] = [];

  for (const user of users) {
    const picks = randomItems(movies, randomInt(5, 15));
    for (const movie of picks) {
      rows.push([randomUUID(), user.id, movie.id, pastDateWithinYear()]);
    }
  }

  await bulkInsert(client, "watchlists", ["id", "user_id", "movie_id", "created_at"], rows);
}

async function seedWatchHistory(client: PoolClient, users: SeededUser[], movies: SeededMovie[]) {
  console.log("Seeding watch history...");
  const released = movies.filter((movie) => movie.isReleased);
  const rows: unknown[][] = [];

  for (const user of users) {
    const watched = randomItems(released, randomInt(3, 10));
    for (const movie of watched) {
      rows.push([randomUUID(), user.id, movie.id, pastDateWithinYear()]);
    }
  }

  await bulkInsert(client, "watch_history", ["id", "user_id", "movie_id", "watched_at"], rows);
}

async function seedFavouriteGenres(client: PoolClient, users: SeededUser[], genres: Array<{ id: string }>) {
  console.log("Seeding favourite genres (user_preferences)...");
  const rows: unknown[][] = [];

  for (const user of users) {
    const favourites = randomItems(genres, randomInt(2, 4));
    for (const genre of favourites) {
      rows.push([randomUUID(), user.id, genre.id, null, pastDateWithinYear()]);
    }
  }

  await bulkInsert(client, "user_preferences", ["id", "user_id", "genre_id", "language_id", "created_at"], rows);
}

// ---------------------------------------------------------------------------
// Recommendations, notifications, AI chat, search history
// ---------------------------------------------------------------------------

const RECOMMENDATION_REASONS = [
  "Because you liked this genre",
  "Based on your booking history",
  "Highly rated near you",
  "Trending this week",
];

async function seedRecommendations(client: PoolClient, users: SeededUser[], movies: SeededMovie[]) {
  console.log("Seeding recommendations (top 10 per user)...");
  const rows: unknown[][] = [];

  for (const user of users) {
    const picks = randomItems(movies, 10);
    picks.forEach((movie, index) => {
      rows.push([randomUUID(), user.id, movie.id, index + 1, randomItem(RECOMMENDATION_REASONS), pastDateWithinYear()]);
    });
  }

  await bulkInsert(client, "recommendations", ["id", "user_id", "movie_id", "rank", "reason", "created_at"], rows);
}

async function seedNotifications(client: PoolClient, users: SeededUser[], movies: SeededMovie[]) {
  console.log("Seeding notifications...");
  const rows: unknown[][] = [];

  for (const user of users) {
    const count = randomInt(3, 6);
    for (let i = 0; i < count; i += 1) {
      const template = randomItem(NOTIFICATION_TEMPLATES);
      const movie = randomItem(movies);
      rows.push([
        randomUUID(), user.id, template.type, template.title, template.message({ movie: movie.title }),
        Math.random() < 0.5, pastDateWithinYear(),
      ]);
    }
  }

  await bulkInsert(client, "notifications", ["id", "user_id", "type", "title", "message", "is_read", "created_at"], rows);
}

async function seedAiChatHistory(
  client: PoolClient,
  users: SeededUser[],
  movies: SeededMovie[],
  genres: Array<{ name: string }>,
) {
  console.log("Seeding AI chat history (10 conversations per user)...");
  const rows: unknown[][] = [];

  for (const user of users) {
    for (let i = 0; i < 10; i += 1) {
      const ctx = { movie: randomItem(movies).title, genre: randomItem(genres).name };
      const templateIndex = randomInt(0, CHAT_PROMPT_TEMPLATES.length - 1);
      rows.push([
        randomUUID(), user.id,
        CHAT_PROMPT_TEMPLATES[templateIndex](ctx),
        CHAT_RESPONSE_TEMPLATES[templateIndex](ctx),
        pastDateWithinYear(),
      ]);
    }
  }

  await bulkInsert(client, "ai_chat_messages", ["id", "user_id", "prompt", "response", "created_at"], rows);
}

async function seedSearchHistory(client: PoolClient, users: SeededUser[]) {
  console.log("Seeding search history...");
  const rows: unknown[][] = [];

  for (const user of users) {
    const queries = randomItems(SEARCH_TERMS, randomInt(3, 8));
    for (const query of queries) {
      rows.push([randomUUID(), user.id, query, pastDateWithinYear()]);
    }
  }

  await bulkInsert(client, "search_history", ["id", "user_id", "query", "created_at"], rows);
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function main() {
  const connectionString = process.env.DATABASE_URL;
  assertDatabaseTargetIsIntentional(connectionString);

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString ?? "");
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await truncateAll(client);

    const locations = await seedLocations(client);
    const genres = await seedGenres(client);
    const languages = await seedLanguages(client);
    const actors = await seedActors(client, TARGET.actorsPoolSize);
    const coupons = await seedCoupons(client);

    const users = await seedUsers(client, locations);
    const movies = await seedMovies(client, genres, languages, actors);
    const theatres = await seedTheatres(client, locations);
    const { screens, seatLabelsByScreen } = await seedScreensAndSeats(client, theatres);
    const screenById = new Map(screens.map((screen) => [screen.id, screen]));

    const shows = await seedShows(client, movies, screens);

    await seedBookingsAndPayments(client, users, shows, screenById, seatLabelsByScreen, coupons);

    await seedReviews(client, users, movies);
    await seedWatchlists(client, users, movies);
    await seedWatchHistory(client, users, movies);
    await seedFavouriteGenres(client, users, genres);
    await seedRecommendations(client, users, movies);
    await seedNotifications(client, users, movies);
    await seedAiChatHistory(client, users, movies, genres);
    await seedSearchHistory(client, users);

    await client.query("COMMIT");
    console.log("Done. Full demo dataset seeded successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed, transaction rolled back.", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
