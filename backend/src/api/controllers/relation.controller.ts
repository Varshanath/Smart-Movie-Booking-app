import { NextFunction, Request, Response } from "express";

import {
  addMovieCast,
  addMovieGenre,
  addUserPreference,
  addWatchHistory,
  getMovieCast,
  getMovieGenres,
  getUserPreferences,
  getWatchHistory,
} from "../../modules/catalog/catalog.service";

export async function listMovieGenresController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ genres: await getMovieGenres(request.params.movieId) });
  } catch (error) {
    next(error);
  }
}

export async function addMovieGenreController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ message: "Movie genre added successfully", movieGenre: await addMovieGenre(request.params.movieId, request.body) });
  } catch (error) {
    next(error);
  }
}

export async function listMovieCastController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ cast: await getMovieCast(request.params.movieId) });
  } catch (error) {
    next(error);
  }
}

export async function addMovieCastController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ message: "Movie cast added successfully", movieCast: await addMovieCast(request.params.movieId, request.body) });
  } catch (error) {
    next(error);
  }
}

export async function listUserPreferencesController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ preferences: await getUserPreferences(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function addUserPreferenceController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ message: "User preference added successfully", preference: await addUserPreference(request.params.userId, request.body) });
  } catch (error) {
    next(error);
  }
}

export async function listWatchHistoryController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ watchHistory: await getWatchHistory(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function addWatchHistoryController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(201).json({ message: "Watch history added successfully", watchHistory: await addWatchHistory(request.params.userId, request.body) });
  } catch (error) {
    next(error);
  }
}
