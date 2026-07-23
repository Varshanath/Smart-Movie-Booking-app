/**
 * Populates the backend with demo movies, theatres, screens, and shows via
 * the public HTTP API, since the patron app has no admin UI to create them.
 * Run against an already-running server: `npm run seed` (defaults to
 * http://localhost:4000, override with API_BASE_URL).
 */

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

interface Movie {
  title: string;
  genre: string;
  language: string;
  durationMinutes: number;
  releaseDate: string;
}

interface Theatre {
  name: string;
  location: string;
  totalSeats: number;
}

interface ScreenPlan {
  name: string;
  rows: number;
  seatsPerRow: number;
}

const movies: Movie[] = [
  {
    title: "Interstellar",
    genre: "Sci-Fi",
    language: "English",
    durationMinutes: 169,
    releaseDate: "2014-11-07",
  },
  {
    title: "The Dark Knight",
    genre: "Action",
    language: "English",
    durationMinutes: 152,
    releaseDate: "2008-07-18",
  },
  {
    title: "Dilwale Dulhania Le Jayenge",
    genre: "Romance",
    language: "Hindi",
    durationMinutes: 190,
    releaseDate: "1995-10-20",
  },
  {
    title: "Parasite",
    genre: "Thriller",
    language: "Korean",
    durationMinutes: 132,
    releaseDate: "2019-05-30",
  },
  {
    title: "3 Idiots",
    genre: "Comedy",
    language: "Hindi",
    durationMinutes: 170,
    releaseDate: "2009-12-25",
  },
];

const theatres: Theatre[] = [
  { name: "PVR Orion Mall", location: "Bengaluru", totalSeats: 400 },
  { name: "INOX Forum Mall", location: "Bengaluru", totalSeats: 400 },
];

const screenPlans: ScreenPlan[] = [
  { name: "Screen 1", rows: 8, seatsPerRow: 10 },
  { name: "Screen 2", rows: 10, seatsPerRow: 12 },
];

const showtimeHours = [10, 14, 18, 21];
const pricesByHour: Record<number, number> = {
  10: 150,
  14: 180,
  18: 260,
  21: 320,
};

async function post(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `POST ${path} failed (${response.status}): ${data.message ?? "unknown error"}`,
    );
  }
  return data;
}

function startTimeAt(daysFromNow: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function seed() {
  console.log(`Seeding demo data into ${baseUrl} ...`);

  const createdMovies = [];
  for (const movie of movies) {
    const { movie: created } = await post("/api/movies", movie);
    createdMovies.push(created);
    console.log(`  movie: ${created.title}`);
  }

  const createdTheatres = [];
  for (const theatre of theatres) {
    const { theatre: created } = await post("/api/theatres", theatre);
    createdTheatres.push(created);
    console.log(`  theatre: ${created.name}`);
  }

  const createdScreens = [];
  for (const theatre of createdTheatres) {
    for (const plan of screenPlans) {
      const { screen: created } = await post("/api/shows/screens", {
        theatreId: theatre.id,
        name: plan.name,
        rows: plan.rows,
        seatsPerRow: plan.seatsPerRow,
      });
      createdScreens.push(created);
      console.log(`  screen: ${theatre.name} - ${created.name}`);
    }
  }

  let showCount = 0;
  for (const [movieIndex, movie] of createdMovies.entries()) {
    for (const [screenIndex, screen] of createdScreens.entries()) {
      const hour = showtimeHours[(movieIndex + screenIndex) % showtimeHours.length];
      const daysFromNow = screenIndex % 2;
      await post("/api/shows", {
        movieId: movie.id,
        screenId: screen.id,
        startTime: startTimeAt(daysFromNow, hour),
        price: pricesByHour[hour],
      });
      showCount += 1;
    }
  }
  console.log(`  shows: ${showCount} created`);

  console.log("Done.");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
