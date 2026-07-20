import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

export const isPostgresEnabled = Boolean(process.env.DATABASE_URL);

export const pool = isPostgresEnabled
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
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
