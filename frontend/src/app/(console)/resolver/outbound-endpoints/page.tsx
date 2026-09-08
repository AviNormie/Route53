import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Outbound endpoints",
  "Configure Route 53 Resolver outbound endpoints",
);

export default function Page() {
  return <ConsolePlaceholder title="Outbound endpoints" />;
}
