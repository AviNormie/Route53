import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Registered domains",
  "View and manage registered domains",
);

export default function Page() {
  return <ConsolePlaceholder title="Registered domains" />;
}
