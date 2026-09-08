import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://route53-ten.vercel.app"),
  title: {
    default: "Amazon Route 53 Clone",
    template: "%s | Route 53 Clone",
  },
  description:
    "A reliable and cost-effective way to route end users to Internet applications — DNS management inspired by AWS Route 53.",
  applicationName: "Route 53 Clone",
  keywords: [
    "Route 53",
    "DNS",
    "hosted zones",
    "DNS records",
    "AWS",
    "domain",
  ],
  authors: [{ name: "Route 53 Clone" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://route53-ten.vercel.app",
    siteName: "Amazon Route 53 Clone",
    title: "Amazon Route 53 Clone",
    description:
      "DNS management platform inspired by AWS Route 53 — hosted zones, records, and console UI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazon Route 53 Clone",
    description:
      "DNS management platform inspired by AWS Route 53 — hosted zones, records, and console UI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body className="min-h-screen overflow-x-hidden font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
