import cors from "cors";
import express from "express";

import { userRoutes } from "./api/routes/user.routes";
import { errorHandler } from "./shared/middleware/error-handler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/users", userRoutes);
  app.use(errorHandler);

  return app;
}
