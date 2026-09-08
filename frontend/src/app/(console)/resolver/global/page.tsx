import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Global resolvers",
  "Manage global Route 53 Resolver configurations",
);

export default function Page() {
  return <ConsolePlaceholder title="Global resolvers" />;
}
