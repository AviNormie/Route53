import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta(
  "Dashboard",
  "Route 53 dashboard — DNS management overview and notifications",
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
