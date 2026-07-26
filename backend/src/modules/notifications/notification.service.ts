import { ApiError } from "../../shared/utils/api-error";
import { listNotifications, markNotificationRead } from "./notification.repository";

export function getNotifications(userId: string) {
  return listNotifications(userId);
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await markNotificationRead(userId, notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  return notification;
}
