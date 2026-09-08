import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "IAM user sign in",
  "Sign in to the AWS Management Console — demo",
);

export default function SigninLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
