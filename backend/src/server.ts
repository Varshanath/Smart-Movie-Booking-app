import "dotenv/config";

import { createApp } from "./app";
import { runMigrations } from "./database/postgres";

const port = Number(process.env.APP_PORT ?? 4000);
const app = createApp();

async function startServer() {
  await runMigrations();

  app.listen(port, () => {
    console.log(`Backend API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend API", error);
  process.exit(1);
});
