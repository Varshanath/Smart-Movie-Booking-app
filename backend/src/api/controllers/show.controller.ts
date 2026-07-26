import { NextFunction, Request, Response } from "express";

import {
  createScreen,
  createShow,
  getScreens,
  getScreenSeats,
  getShows,
  getShowSeatMap,
} from "../../modules/shows/show.service";

export async function listScreensController(_request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ screens: await getScreens() });
  } catch (error) {
    next(error);
  }
}

export async function createScreenController(request: Request, response: Response, next: NextFunction) {
  try {
    const screen = await createScreen(request.body);
    response.status(201).json({ message: "Screen created successfully", screen });
  } catch (error) {
    next(error);
  }
}

export async function listShowsController(_request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ shows: await getShows() });
  } catch (error) {
    next(error);
  }
}

export async function createShowController(request: Request, response: Response, next: NextFunction) {
  try {
    const show = await createShow(request.body);
    response.status(201).json({ message: "Show created successfully", show });
  } catch (error) {
    next(error);
  }
}

export async function getShowSeatsController(request: Request, response: Response, next: NextFunction) {
  try {
    const seatMap = await getShowSeatMap(request.params.showId);
    response.status(200).json({ seatMap });
  } catch (error) {
    next(error);
  }
}

export async function listScreenSeatsController(request: Request, response: Response, next: NextFunction) {
  try {
    const seats = await getScreenSeats(request.params.screenId);
    response.status(200).json({ seats });
  } catch (error) {
    next(error);
  }
}
