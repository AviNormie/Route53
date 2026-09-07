"use client";

import Link from "next/link";
import { FiInfo, FiMenu } from "react-icons/fi";
import { HiChevronRight } from "react-icons/hi";

type ServiceBreadcrumbProps = {
  current: string;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
};

export function ServiceBreadcrumb({
  current,
  sidebarExpanded,
  onToggleSidebar,
}: ServiceBreadcrumbProps) {
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
          <HiChevronRight size={12} className="console-breadcrumb__sep" aria-hidden="true" />
          <span className="console-breadcrumb__current">{current}</span>
        </nav>
      </div>
      <button type="button" className="console-breadcrumb__info" aria-label="Information">
        <FiInfo size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
