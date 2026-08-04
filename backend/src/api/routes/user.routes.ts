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
import { authenticate } from "../../shared/middleware/authenticate";
import { requireOwnUser } from "../../shared/middleware/require-own-user";

export const userRoutes = Router();

// Public — pre-authentication by definition, or genuinely non-personal.
userRoutes.get("/", searchUsersController);
userRoutes.post("/register", registerUser);
userRoutes.post("/login", login);
userRoutes.post("/change-password", changePassword);

// Everything below is a caller's own data — authenticate() verifies the
// bearer token and sets req.user.id; requireOwnUser() then rejects any
// request whose :userId path segment doesn't match req.user.id (403),
// so a valid token for one user can never read/write another user's data.
userRoutes.post("/:userId/profile", authenticate, requireOwnUser, updateProfile);
userRoutes.get("/:userId/preferences", authenticate, requireOwnUser, listUserPreferencesController);
userRoutes.post("/:userId/preferences", authenticate, requireOwnUser, addUserPreferenceController);
userRoutes.get("/:userId/watch-history", authenticate, requireOwnUser, listWatchHistoryController);
userRoutes.post("/:userId/watch-history", authenticate, requireOwnUser, addWatchHistoryController);
userRoutes.get("/:userId/reviews", authenticate, requireOwnUser, listUserReviewsController);
userRoutes.get("/:userId/watchlist", authenticate, requireOwnUser, listWatchlistController);
userRoutes.post("/:userId/watchlist", authenticate, requireOwnUser, addWatchlistItemController);
userRoutes.delete(
  "/:userId/watchlist/:movieId",
  authenticate,
  requireOwnUser,
  removeWatchlistItemController,
);
userRoutes.get("/:userId/recommendations", authenticate, requireOwnUser, listRecommendationsController);
userRoutes.get("/:userId/notifications", authenticate, requireOwnUser, listNotificationsController);
userRoutes.post(
  "/:userId/notifications/:notificationId/read",
  authenticate,
  requireOwnUser,
  markNotificationReadController,
);
userRoutes.get("/:userId/search-history", authenticate, requireOwnUser, listSearchHistoryController);
userRoutes.post("/:userId/search-history", authenticate, requireOwnUser, createSearchHistoryController);
userRoutes.get("/:userId/ai-chat", authenticate, requireOwnUser, listAiChatController);
userRoutes.post("/:userId/ai-chat", authenticate, requireOwnUser, createAiChatController);
