import { NextFunction, Request, Response } from "express";

import {
  createTheatre,
  getTheatres,
} from "../../modules/theatres/theatre.service";

export async function listTheatresController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ theatres: await getTheatres() });
  } catch (error) {
    next(error);
  }
}

export async function createTheatreController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const theatre = await createTheatre(request.body);
    response
      .status(201)
      .json({ message: "Theatre created successfully", theatre });
  } catch (error) {
    next(error);
  }
}
