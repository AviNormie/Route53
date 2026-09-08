import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "VPCs",
  "Associate VPCs with Route 53 Resolver",
);

export default function Page() {
  return <ConsolePlaceholder title="VPCs" />;
}
