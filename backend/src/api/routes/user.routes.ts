import { Router } from "express";

import {
  changePassword,
  login,
  registerUser,
} from "../controllers/user.controller";
import {
  addUserPreferenceController,
  addWatchHistoryController,
  listUserPreferencesController,
  listWatchHistoryController,
} from "../controllers/relation.controller";

export const userRoutes = Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", login);
userRoutes.post("/change-password", changePassword);
userRoutes.get("/:userId/preferences", listUserPreferencesController);
userRoutes.post("/:userId/preferences", addUserPreferenceController);
userRoutes.get("/:userId/watch-history", listWatchHistoryController);
userRoutes.post("/:userId/watch-history", addWatchHistoryController);
