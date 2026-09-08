import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Query logging",
  "Configure DNS query logging for Resolver",
);

export default function Page() {
  return <ConsolePlaceholder title="Query logging" />;
}
