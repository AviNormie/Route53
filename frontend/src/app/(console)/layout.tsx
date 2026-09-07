"use client";

import type { ReactNode } from "react";
import { MockDnsProvider } from "@/lib/mock/store";

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <MockDnsProvider>{children}</MockDnsProvider>;
}
