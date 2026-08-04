import { Router } from "express";

import {
  createBookingController,
  createMovieBookingController,
  listBookingsController,
} from "../controllers/booking.controller";
import { authenticate } from "../../shared/middleware/authenticate";

export const bookingRoutes = Router();

// No :userId path param here, so no requireOwnUser — identity comes
// entirely from the token (see requireAuthenticatedUserId in each
// controller); GET is scoped to the caller's own bookings, and POST
// rejects any body.userId that doesn't match the authenticated caller.
bookingRoutes.get("/", authenticate, listBookingsController);
bookingRoutes.post("/movie", authenticate, createMovieBookingController);
bookingRoutes.post("/", authenticate, createBookingController);
