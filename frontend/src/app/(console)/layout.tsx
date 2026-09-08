import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ConsoleProviders } from "@/components/console/ConsoleProviders";

export const metadata: Metadata = {
  title: {
    default: "Console",
    template: "%s | Route 53",
  },
  description: "Amazon Route 53 Clone management console",
};

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
