import "dotenv/config";

import { createApp } from "./app";

const port = Number(process.env.APP_PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Backend API running on port ${port}`);
});
