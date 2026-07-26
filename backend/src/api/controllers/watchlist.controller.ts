import { NextFunction, Request, Response } from "express";

import {
  addWatchlistItem,
  getWatchlist,
  removeWatchlistItem,
} from "../../modules/watchlist/watchlist.service";

export async function listWatchlistController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ watchlist: await getWatchlist(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function addWatchlistItemController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const item = await addWatchlistItem(request.params.userId, request.body);
    response.status(201).json({ message: "Added to watchlist", item });
  } catch (error) {
    next(error);
  }
}

export async function removeWatchlistItemController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    await removeWatchlistItem(request.params.userId, request.params.movieId);
    response.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    next(error);
  }
}
