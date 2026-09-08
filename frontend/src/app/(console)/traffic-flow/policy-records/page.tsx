import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Policy records",
  "Manage traffic flow policy records",
);

export default function Page() {
  return <ConsolePlaceholder title="Policy records" />;
}
