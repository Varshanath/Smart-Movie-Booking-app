import { Router } from "express";

import {
  dailyRevenueController,
  mostBookedMoviesController,
  mostBookedTheatresController,
  popularGenresController,
  showOccupancyController,
} from "../controllers/analytics.controller";

export const analyticsRoutes = Router();

analyticsRoutes.get("/movies", mostBookedMoviesController);
analyticsRoutes.get("/theatres", mostBookedTheatresController);
analyticsRoutes.get("/genres", popularGenresController);
analyticsRoutes.get("/revenue", dailyRevenueController);
analyticsRoutes.get("/occupancy", showOccupancyController);
