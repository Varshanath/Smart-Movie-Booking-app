import { Router } from "express";

import {
  createCatalogController,
  listCatalogController,
} from "../controllers/catalog.controller";

export const catalogRoutes = Router();

catalogRoutes.get("/languages", listCatalogController);
catalogRoutes.post("/languages", createCatalogController);
catalogRoutes.get("/genres", listCatalogController);
catalogRoutes.post("/genres", createCatalogController);
catalogRoutes.get("/actors", listCatalogController);
catalogRoutes.post("/actors", createCatalogController);
