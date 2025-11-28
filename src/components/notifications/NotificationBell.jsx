import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PiArrowClockwiseBold,
  PiBellBold,
  PiCheckBold,
} from "react-icons/pi";
import { NotificationType } from "../../types/notification";
import { useNotifications } from "../../hooks/useNotifications";
import "./NotificationBell.css";

function formatTime(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale || undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveTitle(notification, t) {
  if (notification.displayTitle) return notification.displayTitle;

  switch (notification.type) {
    case NotificationType.ComplaintResolved:
      return t("notifications.types.complaintResolved");
    case NotificationType.ComplaintDismissed:
      return t("notifications.types.complaintDismissed");
    case NotificationType.UserBanned:
      return t("notifications.types.userBanned");
    default:
      return t("notifications.types.general");
  }
}

export default function NotificationBell({ isAuthenticated }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllRead,
  } = useNotifications({ enabled: isAuthenticated });

  const unseenBadge = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 99) return "99+";
    return String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const togglePanel = () => {
    if (!isAuthenticated) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      refresh();
    }
  };

  const handleMarkRead = (notificationId) => {
    markAsRead(notificationId);
  };

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={togglePanel}
        aria-label={t("notifications.open")}
      >
        <PiBellBold aria-hidden />
        {unseenBadge && (
          <span className="notification-bell__badge" aria-hidden>
            {unseenBadge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel" role="dialog" aria-modal="false">
          <div className="notification-panel__head">
            <div>
              <p className="notification-panel__title">
                {t("notifications.title")}
              </p>
              <p className="notification-panel__subtitle">
                {unreadCount > 0
                  ? t("notifications.unreadCount", { count: unreadCount })
                  : t("notifications.allCaughtUp")}
              </p>
            </div>
            <div className="notification-panel__actions">
              <button
                type="button"
                className="notification-panel__icon"
                onClick={refresh}
                aria-label={t("notifications.refresh")}
              >
                <PiArrowClockwiseBold aria-hidden />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-panel__icon"
                  onClick={markAllRead}
                  aria-label={t("notifications.markAllRead")}
                >
                  <PiCheckBold aria-hidden />
                </button>
              )}
            </div>
          </div>

          <div className="notification-panel__list">
            {isLoading ? (
              <p className="notification-panel__state">
                {t("notifications.loading")}
              </p>
            ) : error ? (
              <p className="notification-panel__state notification-panel__state--error">
                {t(error)}
              </p>
            ) : notifications.length === 0 ? (
              <p className="notification-panel__state">
                {t("notifications.empty")}
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`notification-item ${
                    item.isRead ? "" : "is-unread"
                  }`}
                  onClick={() => handleMarkRead(item.id)}
                >
                  <div className="notification-item__title">
                    <span>{resolveTitle(item, t)}</span>
                    {!item.isRead && (
                      <span className="notification-item__badge">
                        {t("notifications.unread")}
                      </span>
                    )}
                  </div>
                  {item.message && (
                    <p className="notification-item__message">{item.message}</p>
                  )}
                  <p className="notification-item__meta">
                    {formatTime(item.creationTime, i18n.language)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
