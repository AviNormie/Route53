"use client";

import type { ReactNode } from "react";
import { ConsoleAuthProvider } from "@/components/console/ConsoleAuthProvider";
import { ConsoleThemeProvider } from "@/components/console/ConsoleThemeProvider";
import { NotificationsProvider } from "@/components/console/NotificationsProvider";

export function ConsoleProviders({ children }: { children: ReactNode }) {
  return (
    <ConsoleThemeProvider>
      <NotificationsProvider>
        <ConsoleAuthProvider>{children}</ConsoleAuthProvider>
      </NotificationsProvider>
    </ConsoleThemeProvider>
  );
}
