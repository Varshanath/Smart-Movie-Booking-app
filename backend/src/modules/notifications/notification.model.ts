export type NotificationType =
  | "booking_confirmed"
  | "movie_released"
  | "booking_reminder"
  | "offer";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
