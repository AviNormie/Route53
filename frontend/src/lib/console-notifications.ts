export type ConsoleNotificationKind = "user" | "aws";

export type ConsoleNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: ConsoleNotificationKind;
  href?: string;
  read: boolean;
};

export type PushNotificationInput = {
  title: string;
  body: string;
  kind?: ConsoleNotificationKind;
  href?: string;
};

export const NOTIFICATIONS_STORAGE_KEY = "route53-console-notifications";
export const NOTIFICATIONS_EVENT = "route53-console-notifications-changed";

const ACCOUNT_ID = "497535504622";

export function formatNotificationAccountSuffix(region = "GLOBAL"): string {
  return `[AWS Account: ${ACCOUNT_ID}] [${region}]`;
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 45) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function readNotifications(): ConsoleNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConsoleNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.body === "string" &&
          typeof item.createdAt === "string",
      )
      .map((item): ConsoleNotification => ({
        id: item.id,
        title: item.title,
        body: item.body,
        createdAt: item.createdAt,
        href: item.href,
        kind: item.kind === "aws" ? "aws" : "user",
        read: Boolean(item.read),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function writeNotifications(items: ConsoleNotification[]) {
  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export function pushConsoleNotification(input: PushNotificationInput): ConsoleNotification {
  const next: ConsoleNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    kind: input.kind ?? "user",
    href: input.href,
    read: false,
  };
  const items = [next, ...readNotifications()];
  writeNotifications(items);
  return next;
}

export function markAllNotificationsRead() {
  const items = readNotifications().map((item) => ({ ...item, read: true }));
  writeNotifications(items);
}

export function notifyHostedZoneCreated(zoneName: string, zoneId: string) {
  pushConsoleNotification({
    title: "Route 53 Hosted Zone",
    body: `[Notification] Hosted zone ${zoneName} was created ${formatNotificationAccountSuffix()}`,
    href: `/hosted-zones/${zoneId}`,
  });
}

export function notifyHostedZoneDeleted(zoneName: string) {
  pushConsoleNotification({
    title: "Route 53 Hosted Zone",
    body: `[Notification] Hosted zone ${zoneName} was deleted ${formatNotificationAccountSuffix()}`,
    href: "/hosted-zones",
  });
}

export function notifyRecordsChanged(opts: {
  zoneName: string;
  zoneId: string;
  action: "created" | "updated" | "deleted" | "imported";
  count?: number;
  recordLabel?: string;
}) {
  const count = opts.count ?? 1;
  const label =
    opts.recordLabel ??
    (count === 1 ? "1 DNS record" : `${count} DNS records`);
  const verb =
    opts.action === "created"
      ? "created"
      : opts.action === "updated"
        ? "updated"
        : opts.action === "deleted"
          ? "deleted"
          : "imported";

  pushConsoleNotification({
    title: "Route 53 Record Change",
    body: `[Notification] ${label} ${verb} in hosted zone ${opts.zoneName} ${formatNotificationAccountSuffix()}`,
    href: `/hosted-zones/${opts.zoneId}`,
  });
}
