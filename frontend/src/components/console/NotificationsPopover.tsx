"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiMonitor, FiUser } from "react-icons/fi";
import { useConsoleNotifications } from "@/components/console/NotificationsProvider";
import {
  formatRelativeTime,
  type ConsoleNotification,
} from "@/lib/console-notifications";

type TabId = "recent" | "user" | "aws";

type NotificationsPopoverProps = {
  open: boolean;
  onNavigate?: () => void;
};

function HealthIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5.5" y="6" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M9.2 8.2 10.4 9.6l2.1-2.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotificationItem({
  item,
  onNavigate,
}: {
  item: ConsoleNotification;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <span className="console-notifications-menu__item-icon" aria-hidden="true">
        <HealthIcon />
      </span>
      <span className="console-notifications-menu__item-body">
        <span className="console-notifications-menu__item-top">
          <span className="console-notifications-menu__item-title">{item.title}</span>
          <time
            className="console-notifications-menu__item-time"
            dateTime={item.createdAt}
          >
            {formatRelativeTime(item.createdAt)}
          </time>
        </span>
        <span className="console-notifications-menu__item-text">{item.body}</span>
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="console-notifications-menu__item" onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return <div className="console-notifications-menu__item">{content}</div>;
}

export function NotificationsPopover({ open, onNavigate }: NotificationsPopoverProps) {
  const { notifications } = useConsoleNotifications();
  const [tab, setTab] = useState<TabId>("recent");

  const filtered = useMemo(() => {
    if (tab === "user") return notifications.filter((n) => n.kind === "user");
    if (tab === "aws") return notifications.filter((n) => n.kind === "aws");
    return notifications;
  }, [notifications, tab]);

  if (!open) return null;

  return (
    <div className="console-notifications-menu" role="dialog" aria-label="Notifications">
      <div className="console-notifications-menu__header">
        <h2 className="console-notifications-menu__title">Notifications</h2>
        <a
          href="#"
          className="console-notifications-menu__centre-link"
          onClick={(event) => event.preventDefault()}
        >
          Notification centre
        </a>
      </div>

      <div className="console-notifications-menu__tabs" role="tablist" aria-label="Notification filters">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "recent"}
          className={`console-notifications-menu__tab${tab === "recent" ? " is-active" : ""}`}
          onClick={() => setTab("recent")}
        >
          Most recent
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "user"}
          className={`console-notifications-menu__tab${tab === "user" ? " is-active" : ""}`}
          onClick={() => setTab("user")}
        >
          <FiUser size={12} aria-hidden="true" />
          User configured
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "aws"}
          className={`console-notifications-menu__tab${tab === "aws" ? " is-active" : ""}`}
          onClick={() => setTab("aws")}
        >
          <FiMonitor size={12} aria-hidden="true" />
          AWS managed
        </button>
      </div>

      <div className="console-notifications-menu__list" role="tabpanel">
        {filtered.length === 0 ? (
          <p className="console-notifications-menu__empty">No notifications</p>
        ) : (
          filtered.map((item) => (
            <NotificationItem key={item.id} item={item} onNavigate={onNavigate} />
          ))
        )}
      </div>
    </div>
  );
}
