import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Health checks",
  "Monitor the health and performance of your web applications",
);

export default function Page() {
  return <ConsolePlaceholder title="Health checks" />;
}
