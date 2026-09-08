import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "CIDR collections",
  "Manage CIDR collections for IP-based routing",
);

export default function Page() {
  return <ConsolePlaceholder title="CIDR collections" />;
}
