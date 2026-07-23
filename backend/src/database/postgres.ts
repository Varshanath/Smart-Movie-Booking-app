import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

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
