"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  markAllNotificationsRead,
  NOTIFICATIONS_EVENT,
  pushConsoleNotification,
  readNotifications,
  type ConsoleNotification,
  type PushNotificationInput,
} from "@/lib/console-notifications";

type NotificationsState = {
  notifications: ConsoleNotification[];
  unreadCount: number;
  push: (input: PushNotificationInput) => void;
  markAllRead: () => void;
  refresh: () => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ConsoleNotification[]>([]);

  const refresh = useCallback(() => {
    setNotifications(readNotifications());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "route53-console-notifications") refresh();
    };
    window.addEventListener(NOTIFICATIONS_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const push = useCallback((input: PushNotificationInput) => {
    pushConsoleNotification(input);
  }, []);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      push,
      markAllRead,
      refresh,
    }),
    [notifications, unreadCount, push, markAllRead, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useConsoleNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useConsoleNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
