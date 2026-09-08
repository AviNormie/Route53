import type { Metadata } from "next";
import { ConsolePlaceholder } from "@/components/console/ConsolePlaceholder";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Outposts",
  "Manage Route 53 Resolver on Outposts",
);

export default function Page() {
  return <ConsolePlaceholder title="Outposts" />;
}
