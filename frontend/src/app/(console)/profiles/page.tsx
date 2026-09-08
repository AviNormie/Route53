import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Profiles",
  "Manage Route 53 Profiles",
);

export default function Page() {
  return <ConsolePlaceholder title="Profiles" />;
}
