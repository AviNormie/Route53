"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiRefreshCw, FiSettings } from "react-icons/fi";
import { HiChevronDown, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { useMockDns } from "@/lib/mock/store";

export default function HostedZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  const router = useRouter();
  const zoneId = params.zoneId;
  const { hydrated, getZone, getRecordsForZone, deleteRecord, deleteZone } = useMockDns();

  const zone = getZone(zoneId);
  const records = getRecordsForZone(zoneId);

  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [tab, setTab] = useState<"records" | "recovery" | "dnssec" | "tags">("records");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q),
    );
  }, [records, query]);

  const onDeleteZone = () => {
    if (!zone) return;
    if (!window.confirm(`Delete hosted zone ${zone.name}?`)) return;
    deleteZone(zone.id);
    router.push("/hosted-zones");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!hydrated) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <div className="console-page">
          <p className="console-page__muted">Loading hosted zone…</p>
        </div>
      </ConsoleLayout>
    );
  }

  if (!zone) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <div className="console-page">
          <h1 className="console-page__title">Hosted zone not found</h1>
          <Link href="/hosted-zones" className="console-btn console-btn--normal">
            Back to hosted zones
          </Link>
        </div>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name },
      ]}
    >
      <div className="console-page" style={{ maxWidth: "100%" }}>
        <div className="console-zone-header">
          <div className="console-zone-header__title-row">
            <span className="console-badge">{zone.type}</span>
            <h1 className="console-page__title">{zone.name}</h1>
            <a href="#" className="console-link">
              Info
            </a>
          </div>
          <div className="console-zone-header__actions">
            <button type="button" className="console-btn console-btn--normal" onClick={onDeleteZone}>
              Delete zone
            </button>
            <button type="button" className="console-btn console-btn--normal">
              Test record
            </button>
            <button type="button" className="console-btn console-btn--normal">
              Configure query logging
            </button>
          </div>
        </div>

        <div className="console-details-panel">
          <button
            type="button"
            className="console-details-panel__header"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
          >
            <span className="console-details-panel__header-left">
              <HiChevronDown
                size={14}
                style={{ transform: detailsOpen ? undefined : "rotate(-90deg)" }}
                aria-hidden="true"
              />
              Hosted zone details
            </span>
            <span
              className="console-btn console-btn--normal"
              role="link"
              onClick={(e) => e.stopPropagation()}
            >
              Edit hosted zone
            </span>
          </button>
          {detailsOpen ? (
            <div className="console-details-panel__body">
              <dl className="console-detail-grid">
                <div>
                  <dt>Domain name</dt>
                  <dd>{zone.name}</dd>
                </div>
                <div>
                  <dt>Hosted zone ID</dt>
                  <dd>
                    <code>{zone.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{zone.type}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{zone.description || "—"}</dd>
                </div>
                <div>
                  <dt>Record count</dt>
                  <dd>{zone.recordCount}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>

        <div className="console-tabs" role="tablist">
          {(
            [
              ["records", `Records (${records.length})`],
              ["recovery", "Accelerated recovery"],
              ["dnssec", "DNSSEC signing"],
              ["tags", "Hosted zone tags (0)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`console-tabs__tab${tab === id ? " is-active" : ""}`}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "records" ? (
          <>
            <div className="console-records-header">
              <h2 className="console-records-header__title">
                Records ({records.length})
                <a href="#" className="console-link" style={{ fontSize: 13, fontWeight: 600 }}>
                  Info
                </a>
              </h2>
              <div className="console-hz-toolbar__actions">
                <button type="button" className="console-icon-btn" aria-label="Refresh">
                  <FiRefreshCw size={15} />
                </button>
                <button
                  type="button"
                  className="console-btn console-btn--ghost"
                  disabled={selected.length === 0}
                  onClick={() => {
                    selected.forEach((id) => deleteRecord(id));
                    setSelected([]);
                  }}
                >
                  Delete record
                </button>
                <button type="button" className="console-btn console-btn--normal">
                  Import zone file
                </button>
                <Link
                  href={`/hosted-zones/${zone.id}/records/new`}
                  className="console-btn console-btn--primary"
                >
                  Create record
                </Link>
              </div>
            </div>

            <div className="console-hz-filter-row">
              <ConsoleSearch
                placeholder="Filter records by property or value"
                value={query}
                onChange={setQuery}
              />
              <div className="console-filter-chips">
                <button type="button" className="console-filter-chip">
                  Type
                </button>
                <button type="button" className="console-filter-chip">
                  Routing p…
                </button>
                <button type="button" className="console-filter-chip">
                  Alias
                </button>
              </div>
              <div className="console-table-meta">
                <button type="button" className="console-icon-btn" aria-label="Previous page">
                  <HiChevronLeft size={14} />
                </button>
                <span>1</span>
                <button type="button" className="console-icon-btn" aria-label="Next page">
                  <HiChevronRight size={14} />
                </button>
                <button type="button" className="console-icon-btn" aria-label="Table preferences">
                  <FiSettings size={14} />
                </button>
              </div>
            </div>

            <div className="console-table-wrap">
              <table className="console-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" aria-label="Select all" disabled />
                    </th>
                    <th>Record name</th>
                    <th>Type</th>
                    <th>Routing policy</th>
                    <th>Differentiator</th>
                    <th>Alias</th>
                    <th>Value/Route traffic to</th>
                    <th>TTL (seconds)</th>
                    <th>Health check ID</th>
                    <th>Evaluate target health</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="console-table__empty">
                        No records to display
                      </td>
                    </tr>
                  ) : (
                    filtered.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            aria-label={`Select ${record.name}`}
                          />
                        </td>
                        <td>{record.name}</td>
                        <td>{record.type}</td>
                        <td>{record.routingPolicy}</td>
                        <td>{record.differentiator ?? "—"}</td>
                        <td>{record.alias ? "Yes" : "No"}</td>
                        <td className="console-table__value">{record.value}</td>
                        <td>{record.ttl.toLocaleString()}</td>
                        <td>{record.healthCheckId ?? "—"}</td>
                        <td>{record.evaluateTargetHealth ? "Yes" : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="console-page__muted">
            This tab is a visual placeholder in the Route 53 console replica.
          </p>
        )}
      </div>
    </ConsoleLayout>
  );
}
