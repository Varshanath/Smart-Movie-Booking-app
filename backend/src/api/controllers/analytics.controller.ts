import { NextFunction, Request, Response } from "express";

import {
  getDailyRevenue,
  getMostBookedMovies,
  getMostBookedTheatres,
  getPopularGenres,
  getShowOccupancy,
} from "../../modules/analytics/analytics.service";

export async function mostBookedMoviesController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ movies: await getMostBookedMovies() });
  } catch (error) {
    next(error);
  }
}

export async function mostBookedTheatresController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ theatres: await getMostBookedTheatres() });
  } catch (error) {
    next(error);
  }
}

export async function popularGenresController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ genres: await getPopularGenres() });
  } catch (error) {
    next(error);
  }
}

export async function dailyRevenueController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ revenue: await getDailyRevenue() });
  } catch (error) {
    next(error);
  }
}

export async function showOccupancyController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ occupancy: await getShowOccupancy() });
  } catch (error) {
    next(error);
  }
}
