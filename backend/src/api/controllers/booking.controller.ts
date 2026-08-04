import { NextFunction, Request, Response } from "express";

import {
  createBooking,
  getBookings,
} from "../../modules/bookings/booking.service";
import { requireAuthenticatedUserId } from "../../shared/middleware/authenticate";

export async function listBookingsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authenticatedUserId = requireAuthenticatedUserId(request);
    response.status(200).json({ bookings: await getBookings(authenticatedUserId) });
  } catch (error) {
    next(error);
  }
}

export async function createBookingController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authenticatedUserId = requireAuthenticatedUserId(request);
    const booking = await createBooking(request.body, authenticatedUserId);
    response
      .status(201)
      .json({ message: "Booking created successfully", booking });
  } catch (error) {
    next(error);
  }
}

export async function createMovieBookingController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authenticatedUserId = requireAuthenticatedUserId(request);
    const booking = await createBooking(request.body, authenticatedUserId);
    response
      .status(201)
      .json({ message: "Movie booking created successfully", booking });
  } catch (error) {
    next(error);
  }
}
