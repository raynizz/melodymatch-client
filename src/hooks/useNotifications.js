import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { API_HOST } from "../api/constants";
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notificationService";
import { NotificationDto } from "../dto/notification/NotificationDto";
import { getAccessToken } from "../utils/token";

const MAX_CACHED = 50;

export function useNotifications({ enabled = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const connectionRef = useRef(null);
  const isMountedRef = useRef(false);

  const hubUrl = useMemo(
    () => `${API_HOST.replace(/\/$/, "")}/hubs/notification`,
    []
  );

  const stopConnection = useCallback(async () => {
    const connection = connectionRef.current;
    connectionRef.current = null;
    if (connection) {
      try {
        await connection.stop();
      } catch (err) {
        console.warn("Failed to stop notification hub", err);
      }
    }
  }, []);

  const startConnection = useCallback(async () => {
    if (!enabled || connectionRef.current) return;
    const token = getAccessToken();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on("ReceiveNotification", (payload) => {
      const notification = new NotificationDto(payload);
      setNotifications((prev) => {
        const next = [notification, ...prev.filter((n) => n.id !== notification.id)];
        return next.slice(0, MAX_CACHED);
      });
      if (!notification.isRead) {
        setUnreadCount((count) => count + 1);
      }
    });

    try {
      await connection.start();
      connectionRef.current = connection;
    } catch (err) {
      console.warn("Notification hub connection failed", err);
    }
  }, [enabled, hubUrl]);

  const loadNotifications = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const [items, unread] = await Promise.all([
        fetchMyNotifications(),
        fetchUnreadCount(),
      ]);
      if (!isMountedRef.current) return;
      setNotifications(items.slice(0, MAX_CACHED));
      setUnreadCount(unread);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Failed to load notifications", err);
      setError("notifications.loadError");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  const refresh = useCallback(() => loadNotifications(), [loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id !== notificationId) return item;
        wasUnread = !item.isRead;
        return { ...item, isRead: true };
      })
    );
    if (wasUnread) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.warn("Failed to mark all notifications as read", err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopConnection();
    };
  }, [stopConnection]);

  useEffect(() => {
    if (!enabled) {
      stopConnection();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    startConnection();
  }, [enabled, loadNotifications, startConnection, stopConnection]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllRead,
  };
}
