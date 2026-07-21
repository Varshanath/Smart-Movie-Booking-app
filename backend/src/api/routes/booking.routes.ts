import { Router } from "express";

import {
  createBookingController,
  createMovieBookingController,
  listBookingsController,
} from "../controllers/booking.controller";

export const bookingRoutes = Router();

bookingRoutes.get("/", listBookingsController);
bookingRoutes.post("/movie", createMovieBookingController);
bookingRoutes.post("/", createBookingController);
