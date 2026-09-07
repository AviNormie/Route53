"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AmazonQPanel } from "@/components/console/AmazonQPanel";
import { useConsoleAuth } from "@/components/console/ConsoleAuthProvider";
import { useConsoleTheme } from "@/components/console/ConsoleThemeProvider";
import { ConsoleFooter } from "@/components/console/ConsoleFooter";
import { GlobalNav } from "@/components/console/GlobalNav";
import { Route53Sidebar } from "@/components/console/Route53Sidebar";
import {
  ServiceBreadcrumb,
  type BreadcrumbItem,
} from "@/components/console/ServiceBreadcrumb";

type ConsoleLayoutProps = {
  children: ReactNode;
  breadcrumb?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export function ConsoleLayout({
  children,
  breadcrumb = "Dashboard",
  breadcrumbs,
}: ConsoleLayoutProps) {
  const { session, error: authError } = useConsoleAuth();
  const { resolvedTheme } = useConsoleTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [amazonQOpen, setAmazonQOpen] = useState(false);

  useEffect(() => {
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
    <div
      className={`console-shell${amazonQOpen ? " is-amazon-q-open" : ""}`}
      data-console-theme={resolvedTheme}
    >
      <GlobalNav
        session={session}
        amazonQOpen={amazonQOpen}
        onToggleAmazonQ={() => setAmazonQOpen((v) => !v)}
      />
      <div className="console-shell__below-nav">
        <AmazonQPanel open={amazonQOpen} onClose={() => setAmazonQOpen(false)} />
        <div className="console-shell__primary">
          <ServiceBreadcrumb
            current={breadcrumb}
            items={breadcrumbs}
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
              <main className="console-main">
                {authError ? (
                  <div className="console-auth-banner" role="status">
                    <span>{authError}</span>
                    <Link href="/login" className="console-link">
                      Sign in
                    </Link>
                  </div>
                ) : null}
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
      <ConsoleFooter />
      <Link href="/" className="sr-only">
        Back to marketing site
      </Link>
    </div>
  );
}
