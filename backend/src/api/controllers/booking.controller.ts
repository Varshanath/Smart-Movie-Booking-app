import { NextFunction, Request, Response } from "express";

import {
  createBooking,
  getBookings,
} from "../../modules/bookings/booking.service";

export async function listBookingsController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ bookings: await getBookings() });
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
    const booking = await createBooking(request.body);
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
    const booking = await createBooking(request.body);
    response
      .status(201)
      .json({ message: "Movie booking created successfully", booking });
  } catch (error) {
    next(error);
  }
}
