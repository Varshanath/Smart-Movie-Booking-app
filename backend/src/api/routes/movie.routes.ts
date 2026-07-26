import { Router } from "express";

import {
  createMovieController,
  listMoviesController,
} from "../controllers/movie.controller";
import {
  addMovieCastController,
  addMovieGenreController,
  listMovieCastController,
  listMovieGenresController,
} from "../controllers/relation.controller";
import {
  createMovieReviewController,
  listMovieReviewsController,
} from "../controllers/review.controller";

export const movieRoutes = Router();

movieRoutes.get("/", listMoviesController);
movieRoutes.post("/", createMovieController);
movieRoutes.get("/:movieId/genres", listMovieGenresController);
movieRoutes.post("/:movieId/genres", addMovieGenreController);
movieRoutes.get("/:movieId/cast", listMovieCastController);
movieRoutes.post("/:movieId/cast", addMovieCastController);
movieRoutes.get("/:movieId/reviews", listMovieReviewsController);
movieRoutes.post("/:movieId/reviews", createMovieReviewController);
