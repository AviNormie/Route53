import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up for AWS",
  description: "Create an AWS account — demo signup page",
};

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
