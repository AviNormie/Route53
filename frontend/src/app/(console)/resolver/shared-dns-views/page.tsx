import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Shared DNS views",
  "Manage shared DNS views for Route 53 Resolver",
);

export default function Page() {
  return <ConsolePlaceholder title="Shared DNS views" />;
}
