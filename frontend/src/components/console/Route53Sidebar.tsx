"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HiChevronDown, HiChevronLeft, HiChevronRight } from "react-icons/hi";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
};

type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

const TOP_LINKS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hosted zones", href: "/hosted-zones" },
  { label: "Health checks", href: "/health-checks" },
  { label: "Profiles", href: "/profiles" },
];

const SECTIONS: NavSection[] = [
  {
    id: "global-resolver",
    title: "Global resolver",
    items: [
      { label: "Global resolvers", href: "/resolver/global", badge: "New" },
      { label: "Shared DNS views", href: "/resolver/shared-dns-views", badge: "New" },
    ],
  },
  {
    id: "vpc-resolver",
    title: "VPC resolver",
    items: [
      { label: "VPCs", href: "/resolver/vpcs" },
      { label: "Inbound endpoints", href: "/resolver/inbound-endpoints" },
      { label: "Outbound endpoints", href: "/resolver/outbound-endpoints" },
      { label: "Rules", href: "/resolver/rules" },
      { label: "Query logging", href: "/resolver/query-logging" },
      { label: "Outposts", href: "/resolver/outposts" },
    ],
  },
  {
    id: "domains",
    title: "Domains",
    items: [
      { label: "Registered domains", href: "/domains/registered" },
      { label: "Requests", href: "/domains/requests" },
    ],
  },
  {
    id: "ip-routing",
    title: "IP-based routing",
    items: [{ label: "CIDR collections", href: "/routing/cidr-collections" }],
  },
  {
    id: "traffic-flow",
    title: "Traffic flow",
    items: [
      { label: "Traffic policies", href: "/traffic-policies" },
      { label: "Policy records", href: "/traffic-flow/policy-records" },
    ],
  },
];

type Route53SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onNavigate: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Route53Sidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onNavigate,
}: Route53SidebarProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, true])),
  );

  if (collapsed && !mobileOpen) return null;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`console-sidebar${mobileOpen ? " is-mobile-open" : ""}`}
      aria-label="Route 53 navigation"
    >
      <div className="console-sidebar__header">
        <span className="console-sidebar__title">Route 53</span>
        <button
          type="button"
          className="console-sidebar__collapse"
          aria-label="Collapse sidebar"
          onClick={onCollapse}
        >
          <HiChevronLeft size={16} aria-hidden="true" />
        </button>
      </div>

      <nav className="console-sidebar__nav">
        <ul className="console-sidebar__list">
          {TOP_LINKS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`console-sidebar__link${active ? " is-active" : ""}`}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {SECTIONS.map((section) => {
          const open = openSections[section.id];
          return (
            <div key={section.id} className="console-sidebar__section">
              <button
                type="button"
                className="console-sidebar__section-toggle"
                aria-expanded={open}
                onClick={() => toggleSection(section.id)}
              >
                {open ? (
                  <HiChevronDown size={12} aria-hidden="true" />
                ) : (
                  <HiChevronRight size={12} aria-hidden="true" />
                )}
                <span>{section.title}</span>
              </button>
              {open ? (
                <ul className="console-sidebar__list">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`console-sidebar__link${active ? " is-active" : ""}`}
                          onClick={onNavigate}
                        >
                          <span>{item.label}</span>
                          {item.badge ? (
                            <span className="console-sidebar__badge">{item.badge}</span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
