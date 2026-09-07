import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IAM user sign in",
  description: "Sign in to the AWS Management Console — demo",
};

export default function SigninLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
