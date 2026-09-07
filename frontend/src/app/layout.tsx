import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route 53 Clone",
  description: "DNS management platform inspired by AWS Route 53",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
