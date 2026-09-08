import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta(
  "Hosted zone",
  "View and manage DNS records for this hosted zone",
);

export default function HostedZoneDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
