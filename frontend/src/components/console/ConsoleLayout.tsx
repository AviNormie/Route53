"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ensureMockSession, getMockSession, type MockSession } from "@/lib/mock/session";
import { ConsoleFooter } from "@/components/console/ConsoleFooter";
import { GlobalNav } from "@/components/console/GlobalNav";
import { Route53Sidebar } from "@/components/console/Route53Sidebar";
import { ServiceBreadcrumb } from "@/components/console/ServiceBreadcrumb";

type ConsoleLayoutProps = {
  children: ReactNode;
  breadcrumb?: string;
};

export function ConsoleLayout({ children, breadcrumb = "Dashboard" }: ConsoleLayoutProps) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    ensureMockSession();
    setSession(getMockSession());

    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      if (mq.matches) {
        setSidebarOpen(false);
        setMobileSidebar(false);
      } else {
        setSidebarOpen(true);
        setMobileSidebar(false);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileSidebar((v) => !v);
    } else {
      setSidebarOpen((v) => !v);
    }
  };

  const closeMobile = () => setMobileSidebar(false);

  return (
    <div className="console-shell">
      <GlobalNav session={session} />
      <ServiceBreadcrumb
        current={breadcrumb}
        sidebarExpanded={sidebarOpen || mobileSidebar}
        onToggleSidebar={toggleSidebar}
      />
      <div className="console-body">
        {(sidebarOpen || mobileSidebar) && (
          <Route53Sidebar
            collapsed={!sidebarOpen && !mobileSidebar}
            mobileOpen={mobileSidebar}
            onCollapse={() => {
              setSidebarOpen(false);
              setMobileSidebar(false);
            }}
            onNavigate={closeMobile}
          />
        )}
        {mobileSidebar ? (
          <button
            type="button"
            className="console-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={closeMobile}
          />
        ) : null}
        <div className="console-main-column">
          <main className="console-main">{children}</main>
          <ConsoleFooter />
        </div>
      </div>
      <Link href="/" className="sr-only">
        Back to marketing site
      </Link>
    </div>
  );
}
