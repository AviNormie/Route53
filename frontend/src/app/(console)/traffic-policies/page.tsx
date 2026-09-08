import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Traffic policies",
  "Create and manage Route 53 traffic policies",
);

export default function Page() {
  return <ConsolePlaceholder title="Traffic policies" />;
}
