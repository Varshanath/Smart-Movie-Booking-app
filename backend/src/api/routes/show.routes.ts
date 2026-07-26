import { Router } from "express";

import {
  createScreenController,
  createShowController,
  getShowSeatsController,
  listScreensController,
  listScreenSeatsController,
  listShowsController,
} from "../controllers/show.controller";

export const showRoutes = Router();

showRoutes.get("/screens", listScreensController);
showRoutes.post("/screens", createScreenController);
showRoutes.get("/screens/:screenId/seats", listScreenSeatsController);
showRoutes.get("/:showId/seats", getShowSeatsController);
showRoutes.get("/", listShowsController);
showRoutes.post("/", createShowController);
