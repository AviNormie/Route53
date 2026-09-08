import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Sign in",
  "Sign in to Amazon Route 53 Clone with your demo account",
);

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
