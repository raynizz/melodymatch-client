import { apiClient } from "./httpClient";
import { NotificationDto } from "../dto/notification/NotificationDto";

const NOTIFICATION_BASE_URL = "/api/app/notification";

export async function fetchMyNotifications({ isRead } = {}) {
  const params = {};
  if (typeof isRead === "boolean") {
    params.isRead = isRead;
  }

  const { data } = await apiClient.get(
    `${NOTIFICATION_BASE_URL}/my-notifications`,
    { params }
  );

  const items = Array.isArray(data) ? data : [];
  return items.map((item) => new NotificationDto(item));
}

export async function fetchUnreadCount() {
  const { data } = await apiClient.get(
    `${NOTIFICATION_BASE_URL}/unread-count`
  );
  const numeric = Number(data);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  await apiClient.post(
    `${NOTIFICATION_BASE_URL}/mark-as-read`,
    null,
    {
      params: { notificationId },
    }
  );
}

export async function markAllNotificationsAsRead() {
  await apiClient.post(`${NOTIFICATION_BASE_URL}/mark-all-as-read`);
}
