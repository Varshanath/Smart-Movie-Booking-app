import { Router } from "express";

import {
  createMovieController,
  listMoviesController,
} from "../controllers/movie.controller";

export const movieRoutes = Router();

movieRoutes.get("/", listMoviesController);
movieRoutes.post("/", createMovieController);
