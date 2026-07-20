import { NextFunction, Request, Response } from "express";

import { createMovie, getMovies } from "../../modules/movies/movie.service";

export async function listMoviesController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ movies: await getMovies() });
  } catch (error) {
    next(error);
  }
}

export async function createMovieController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const movie = await createMovie(request.body);
    response.status(201).json({ message: "Movie created successfully", movie });
  } catch (error) {
    next(error);
  }
}
