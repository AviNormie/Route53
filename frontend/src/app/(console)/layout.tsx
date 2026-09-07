"use client";

import type { ReactNode } from "react";
import { ConsoleAuthProvider } from "@/components/console/ConsoleAuthProvider";
import { ConsoleThemeProvider } from "@/components/console/ConsoleThemeProvider";

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ConsoleThemeProvider>
      <ConsoleAuthProvider>{children}</ConsoleAuthProvider>
    </ConsoleThemeProvider>
  );
}
