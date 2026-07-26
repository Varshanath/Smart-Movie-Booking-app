import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Pool, types } from "pg";

// node-pg returns NUMERIC and BIGINT (incl. COUNT()/SUM() results) as
// strings by default, since they can exceed JS's safe integer range. This
// app's values never do, so parse them to real numbers app-wide rather than
// making every caller (and the Flutter client) handle stringly-typed numbers.
types.setTypeParser(1700, (value) => parseFloat(value)); // NUMERIC
types.setTypeParser(20, (value) => parseInt(value, 10)); // BIGINT / COUNT()

export const isPostgresEnabled = Boolean(process.env.DATABASE_URL);

const isLocalDatabase = /localhost|127\.0\.0\.1/.test(
  process.env.DATABASE_URL ?? "",
);

export const pool = isPostgresEnabled
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
    })
  : undefined;

export async function runMigrations() {
  if (!pool) {
    return;
  }

  const migrationsPath = join(
    process.cwd(),
    "src",
    "database",
    "migrations",
  );

  const migrationFiles = readdirSync(migrationsPath)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migrationSql = readFileSync(
      join(migrationsPath, migrationFile),
      "utf8",
    );
    await pool.query(migrationSql);
  }
}
