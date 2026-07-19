import { Router } from "express";

import {
  changePassword,
  login,
  registerUser,
} from "../controllers/user.controller";

export const userRoutes = Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", login);
userRoutes.post("/change-password", changePassword);
