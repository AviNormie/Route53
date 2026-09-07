"use client";

import Link from "next/link";
import { useState } from "react";
import { FiExternalLink, FiRefreshCw } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { INITIAL_NOTIFICATIONS } from "@/lib/mock/notifications";

const ACTIONS = [
  {
    title: "DNS management",
    body: "A hosted zone tells Route 53 how to respond to DNS queries for a domain such as example.com.",
    cta: "Create hosted zone",
    href: "/hosted-zones/new",
  },
  {
    title: "Availability monitoring",
    body: "Health checks monitor your applications and web resources, and direct DNS queries to healthy resources.",
    cta: "Create health check",
    href: "/health-checks",
  },
  {
    title: "Traffic management",
    body: "A visual tool that lets you easily create policies for multiple endpoints in complex configurations.",
    cta: "Create policy",
    href: "/traffic-policies",
  },
  {
    title: "Domain registration",
    body: "A domain is the name, such as example.com, that your users use to access your application.",
    cta: "Register domain",
    href: "/domains/registered",
  },
] as const;

const MORE_RESOURCES = [
  "Documentation",
  "API reference",
  "FAQs",
  "Forum - DNS and health checks",
  "Forum - Domain name registration",
  "Request a limit increase",
] as const;

export default function DashboardPage() {
  const [domain, setDomain] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [notifQuery, setNotifQuery] = useState("");

  const notifications = INITIAL_NOTIFICATIONS.filter((n) =>
    n.resource.toLowerCase().includes(notifQuery.toLowerCase()),
  );

  const onCheckDomain = () => {
    const value = domain.trim();
    if (!value) {
      setCheckMessage("Enter a domain name to check availability.");
      return;
    }
    setCheckMessage(`"${value}" availability check is mocked — no real registration is performed.`);
  };

  return (
    <ConsoleLayout breadcrumb="Dashboard">
      <div className="console-page">
        <div className="console-page__heading-row">
          <h1 className="console-page__title">Route 53 Dashboard</h1>
          <a href="#" className="console-link">
            Info
          </a>
        </div>

        <ConsoleCard padded={false} className="console-actions-card">
          <div className="console-actions-grid">
            {ACTIONS.map((action) => (
              <div key={action.title} className="console-action-tile">
                <h3 className="console-action-tile__title">{action.title}</h3>
                <p className="console-action-tile__body">{action.body}</p>
                <Link
                  href={action.href}
                  className={`console-btn ${
                    action.cta === "Create hosted zone"
                      ? "console-btn--primary"
                      : "console-btn--normal"
                  }`}
                >
                  {action.cta}
                </Link>
              </div>
            ))}
          </div>
        </ConsoleCard>

        <ConsoleCard title="Register domain">
          <p className="console-card__intro">
            Find and register an available domain, or{" "}
            <a href="#" className="console-link">
              transfer your existing domains
            </a>{" "}
            to Route 53.
          </p>
          <div className="console-register-row">
            <input
              className="console-input console-input--lg"
              placeholder="Enter a domain name"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              aria-label="Enter a domain name"
            />
            <ConsoleButton variant="normal" onClick={onCheckDomain}>
              Check
            </ConsoleButton>
          </div>
          <p className="console-field__hint">
            Domain names can contain only the characters a-z, 0-9, and - (hyphen). A domain name
            cannot begin or end with a hyphen. Spaces are not allowed.
          </p>
          {checkMessage ? <p className="console-inline-msg">{checkMessage}</p> : null}
        </ConsoleCard>

        <ConsoleCard
          title="Notifications"
          actions={
            <div className="console-card__toolbar">
              <button type="button" className="console-icon-btn" aria-label="Refresh notifications">
                <FiRefreshCw size={14} />
              </button>
              <div className="console-pager" aria-label="Notifications pagination">
                <button type="button" className="console-icon-btn" aria-label="Previous page">
                  <HiChevronLeft size={14} />
                </button>
                <span>1</span>
                <button type="button" className="console-icon-btn" aria-label="Next page">
                  <HiChevronRight size={14} />
                </button>
              </div>
            </div>
          }
        >
          <ConsoleSearch
            placeholder="Find notifications"
            value={notifQuery}
            onChange={setNotifQuery}
            className="console-search--compact"
          />
          <div className="console-table-wrap">
            <table className="console-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Status</th>
                  <th>Last update</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="console-table__empty">
                      No notifications to display
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id}>
                      <td>{n.resource}</td>
                      <td>{n.status}</td>
                      <td>{n.lastUpdate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ConsoleCard>

        <div className="console-two-col">
          <ConsoleCard
            title={
              <>
                More resources <FiExternalLink size={12} aria-hidden="true" />
              </>
            }
            padded={false}
          >
            <ul className="console-resource-list">
              {MORE_RESOURCES.map((label) => (
                <li key={label}>
                  <a href="#" className="console-link">
                    {label}
                    <FiExternalLink size={11} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </ConsoleCard>

          <ConsoleCard title="Service health">
            <p className="console-card__intro">
              To view the current status of Route 53, see the{" "}
              <a href="#" className="console-link">
                AWS Service Health Dashboard <FiExternalLink size={11} aria-hidden="true" />
              </a>
              .
            </p>
          </ConsoleCard>
        </div>
      </div>
    </ConsoleLayout>
  );
}
