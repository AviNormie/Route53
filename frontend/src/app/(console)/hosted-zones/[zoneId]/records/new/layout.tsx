import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta(
  "Create record",
  "Create a DNS record in this hosted zone",
);

export default function NewRecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
