import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Rules",
  "Manage Route 53 Resolver forwarding rules",
);

export default function Page() {
  return <ConsolePlaceholder title="Rules" />;
}
