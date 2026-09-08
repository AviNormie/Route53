import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta(
  "Hosted zones",
  "Create and manage public and private hosted zones",
);

export default function HostedZonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
