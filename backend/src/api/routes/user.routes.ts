import { Router } from "express";

import {
  changePassword,
  login,
  registerUser,
  searchUsersController,
  updateProfile,
} from "../controllers/user.controller";
import {
  addUserPreferenceController,
  addWatchHistoryController,
  listUserPreferencesController,
  listWatchHistoryController,
} from "../controllers/relation.controller";
import { listUserReviewsController } from "../controllers/review.controller";
import {
  addWatchlistItemController,
  listWatchlistController,
  removeWatchlistItemController,
} from "../controllers/watchlist.controller";
import {
  createAiChatController,
  createSearchHistoryController,
  listAiChatController,
  listNotificationsController,
  listRecommendationsController,
  listSearchHistoryController,
  markNotificationReadController,
} from "../controllers/engagement.controller";

export const userRoutes = Router();

userRoutes.get("/", searchUsersController);
userRoutes.post("/register", registerUser);
userRoutes.post("/login", login);
userRoutes.post("/change-password", changePassword);
userRoutes.post("/:userId/profile", updateProfile);
userRoutes.get("/:userId/preferences", listUserPreferencesController);
userRoutes.post("/:userId/preferences", addUserPreferenceController);
userRoutes.get("/:userId/watch-history", listWatchHistoryController);
userRoutes.post("/:userId/watch-history", addWatchHistoryController);
userRoutes.get("/:userId/reviews", listUserReviewsController);
userRoutes.get("/:userId/watchlist", listWatchlistController);
userRoutes.post("/:userId/watchlist", addWatchlistItemController);
userRoutes.delete("/:userId/watchlist/:movieId", removeWatchlistItemController);
userRoutes.get("/:userId/recommendations", listRecommendationsController);
userRoutes.get("/:userId/notifications", listNotificationsController);
userRoutes.post("/:userId/notifications/:notificationId/read", markNotificationReadController);
userRoutes.get("/:userId/search-history", listSearchHistoryController);
userRoutes.post("/:userId/search-history", createSearchHistoryController);
userRoutes.get("/:userId/ai-chat", listAiChatController);
userRoutes.post("/:userId/ai-chat", createAiChatController);
