import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Domain requests",
  "Track domain registration and transfer requests",
);

export default function Page() {
  return <ConsolePlaceholder title="Requests" />;
}
