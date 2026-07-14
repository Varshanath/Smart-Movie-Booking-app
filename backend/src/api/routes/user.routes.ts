import { Router } from "express";

import { registerUser } from "../controllers/user.controller";

export const userRoutes = Router();

userRoutes.post("/register", registerUser);
