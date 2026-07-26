import { NextFunction, Request, Response } from "express";

import { sendAiChatMessage, getAiChatHistory } from "../../modules/ai-chat/ai-chat.service";
import { markAsRead, getNotifications } from "../../modules/notifications/notification.service";
import { getRecommendations } from "../../modules/recommendations/recommendation.service";
import {
  addSearchHistoryEntry,
  getSearchHistory,
} from "../../modules/search-history/search-history.service";

export async function listRecommendationsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ recommendations: await getRecommendations(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function listNotificationsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ notifications: await getNotifications(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationReadController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const notification = await markAsRead(request.params.userId, request.params.notificationId);
    response.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    next(error);
  }
}

export async function listSearchHistoryController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ searchHistory: await getSearchHistory(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function createSearchHistoryController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const entry = await addSearchHistoryEntry(request.params.userId, request.body);
    response.status(201).json({ message: "Search recorded", entry });
  } catch (error) {
    next(error);
  }
}

export async function listAiChatController(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ messages: await getAiChatHistory(request.params.userId) });
  } catch (error) {
    next(error);
  }
}

export async function createAiChatController(request: Request, response: Response, next: NextFunction) {
  try {
    const message = await sendAiChatMessage(request.params.userId, request.body);
    response.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}
