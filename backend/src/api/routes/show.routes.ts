import { Router } from "express";

import {
  createScreenController,
  createShowController,
  listScreensController,
  listShowsController,
} from "../controllers/show.controller";

export const showRoutes = Router();

showRoutes.get("/screens", listScreensController);
showRoutes.post("/screens", createScreenController);
showRoutes.get("/", listShowsController);
showRoutes.post("/", createShowController);
