import { NextFunction, Request, Response } from "express";

import { getLocations } from "../../modules/locations/location.service";

export async function listLocationsController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ locations: await getLocations() });
  } catch (error) {
    next(error);
  }
}
