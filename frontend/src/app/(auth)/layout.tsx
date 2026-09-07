import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started",
  description: "Sign in to Amazon Route 53 Clone with AWS Builder ID",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
