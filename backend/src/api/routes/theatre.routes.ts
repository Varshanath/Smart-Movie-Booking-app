import { Router } from "express";

import {
  createTheatreController,
  listTheatresController,
} from "../controllers/theatre.controller";

export const theatreRoutes = Router();

theatreRoutes.get("/", listTheatresController);
theatreRoutes.post("/", createTheatreController);
