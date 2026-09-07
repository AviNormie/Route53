"use client";

import Link from "next/link";
import { FiColumns, FiInfo, FiMenu } from "react-icons/fi";
import { HiChevronRight } from "react-icons/hi";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ServiceBreadcrumbProps = {
  /** Single trailing label (legacy) or full trail after Route 53 */
  current?: string;
  items?: BreadcrumbItem[];
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
};

export function ServiceBreadcrumb({
  current,
  items,
  sidebarExpanded,
  onToggleSidebar,
}: ServiceBreadcrumbProps) {
  const trail: BreadcrumbItem[] =
    items && items.length > 0
      ? items
      : [{ label: current ?? "Dashboard" }];

  return (
    <div className="console-breadcrumb">
      <div className="console-breadcrumb__left">
        <button
          type="button"
          className={`console-breadcrumb__menu${sidebarExpanded ? " is-active" : ""}`}
          aria-label={sidebarExpanded ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
        >
          <FiMenu size={16} aria-hidden="true" />
        </button>
        <nav className="console-breadcrumb__trail" aria-label="Breadcrumb">
          <Link href="/dashboard" className="console-breadcrumb__link">
            Route 53
          </Link>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <span key={`${item.label}-${index}`} className="console-breadcrumb__segment">
                <HiChevronRight size={12} className="console-breadcrumb__sep" aria-hidden="true" />
                {item.href && !isLast ? (
                  <Link href={item.href} className="console-breadcrumb__link">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "console-breadcrumb__current" : "console-breadcrumb__link"}>
                    {item.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>
      <div className="console-breadcrumb__right">
        <button type="button" className="console-breadcrumb__info" aria-label="Split panel">
          <FiColumns size={15} aria-hidden="true" />
        </button>
        <button type="button" className="console-breadcrumb__info" aria-label="Information">
          <FiInfo size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
