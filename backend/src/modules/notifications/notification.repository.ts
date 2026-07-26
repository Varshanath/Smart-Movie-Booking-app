import { isPostgresEnabled, pool } from "../../database/postgres";
import { Notification } from "./notification.model";

const notifications = new Map<string, Notification>();

const SELECT_COLUMNS = `
  id,
  user_id AS "userId",
  type,
  title,
  message,
  is_read AS "isRead",
  created_at AS "createdAt"
`;

export async function listNotifications(userId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows as Notification[];
  }
  return Array.from(notifications.values())
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationRead(userId: string, notificationId: string) {
  if (isPostgresEnabled && pool) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING ${SELECT_COLUMNS}`,
      [notificationId, userId],
    );
    return result.rows[0] as Notification | undefined;
  }

  const notification = notifications.get(notificationId);
  if (!notification || notification.userId !== userId) {
    return undefined;
  }
  const updated: Notification = { ...notification, isRead: true };
  notifications.set(notificationId, updated);
  return updated;
}

export async function clearNotificationsForTests() {
  if (isPostgresEnabled && pool) {
    await pool.query("DELETE FROM notifications");
    return;
  }
  notifications.clear();
}
