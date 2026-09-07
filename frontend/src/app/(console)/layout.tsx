"use client";

import type { ReactNode } from "react";
import { ConsoleAuthProvider } from "@/components/console/ConsoleAuthProvider";

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <ConsoleAuthProvider>{children}</ConsoleAuthProvider>;
}
