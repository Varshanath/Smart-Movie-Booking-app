import { Router } from "express";

import {
  createBookingController,
  listBookingsController,
} from "../controllers/booking.controller";

export const bookingRoutes = Router();

bookingRoutes.get("/", listBookingsController);
bookingRoutes.post("/", createBookingController);
