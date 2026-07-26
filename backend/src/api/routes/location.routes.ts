import { Router } from "express";

import { listLocationsController } from "../controllers/location.controller";

export const locationRoutes = Router();

locationRoutes.get("/", listLocationsController);
