import { NotificationType } from "../../types/notification";

export class NotificationDto {
  constructor(payload = {}) {
    this.id = payload.id ?? payload.Id ?? "";
    this.userId = payload.userId ?? payload.UserId ?? "";
    this.type =
      typeof payload.type === "number"
        ? payload.type
        : typeof payload.Type === "number"
          ? payload.Type
          : NotificationType.General;
    this.title = payload.title ?? payload.Title ?? "";
    this.message = payload.message ?? payload.Message ?? "";
    this.isRead = Boolean(payload.isRead ?? payload.IsRead);
    this.relatedEntityId =
      payload.relatedEntityId ?? payload.RelatedEntityId ?? "";
    this.creationTime =
      payload.creationTime ??
      payload.CreationTime ??
      payload.createdAt ??
      null;
  }

  get displayTitle() {
    return this.title || "Notification";
  }
}
