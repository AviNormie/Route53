import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "Sign up for AWS",
  "Create an AWS account — demo signup page",
);

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
