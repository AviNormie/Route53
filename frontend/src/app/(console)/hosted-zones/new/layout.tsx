import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta(
  "Create hosted zone",
  "Create a new public or private hosted zone",
);

export default function NewHostedZoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
