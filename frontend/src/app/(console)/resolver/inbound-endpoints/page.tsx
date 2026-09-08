import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Inbound endpoints",
  "Configure Route 53 Resolver inbound endpoints",
);

export default function Page() {
  return <ConsolePlaceholder title="Inbound endpoints" />;
}
