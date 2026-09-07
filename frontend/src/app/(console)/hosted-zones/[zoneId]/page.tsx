"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FiCheckCircle, FiRefreshCw, FiSettings, FiX } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { ConsoleSkeleton } from "@/components/console/ConsoleSkeleton";
import { TriangleDownIcon } from "@/components/console/TriangleDownIcon";
import {
  ApiError,
  deleteDnsRecord,
  deleteHostedZone,
  displayDomain,
  getHostedZone,
  listDnsRecords,
  type DnsRecord,
  type HostedZone,
} from "@/lib/api";

type ZoneTab = "records" | "recovery" | "dnssec" | "tags";

function formatRecordValue(record: DnsRecord): string {
  if (record.priority != null) return `${record.priority} ${record.value}`;
  return record.value;
}

function SortLabel({ children }: { children: ReactNode }) {
  return (
    <span className="console-hz-sort-label">
      {children}
      <TriangleDownIcon className="sort-icon" size={8} />
    </span>
  );
}

export default function HostedZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  const router = useRouter();
  const zoneId = params.zoneId;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tab, setTab] = useState<ZoneTab>("records");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [routingFilter, setRoutingFilter] = useState("all");
  const [aliasFilter, setAliasFilter] = useState("all");
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") {
      setJustCreated(true);
      window.history.replaceState({}, "", `/hosted-zones/${zoneId}`);
    }
  }, [zoneId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [z, recs] = await Promise.all([
        getHostedZone(zoneId),
        listDnsRecords(zoneId, { page_size: 100 }),
      ]);
      setZone(z);
      setRecords(recs.items);
    } catch (err) {
      setZone(null);
      setRecords([]);
      setError(err instanceof ApiError ? err.message : "Failed to load hosted zone.");
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (aliasFilter === "yes") return false;
      if (routingFilter !== "all" && routingFilter !== "Simple") return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q)
      );
    });
  }, [records, query, typeFilter, routingFilter, aliasFilter]);

  const recordTypes = useMemo(
    () => Array.from(new Set(records.map((r) => r.type))).sort(),
    [records],
  );

  const onDeleteZone = async () => {
    if (!zone) return;
    if (!window.confirm(`Delete hosted zone ${displayDomain(zone.name)}?`)) return;
    setBusy(true);
    try {
      await deleteHostedZone(zone.id);
      router.push("/hosted-zones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete zone.");
      setBusy(false);
    }
  };

  const onDeleteRecords = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} record(s)?`)) return;
    setBusy(true);
    try {
      await Promise.all(selected.map((id) => deleteDnsRecord(id)));
      setSelected([]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete records.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((r) => r.id));
    }
  };

  if (loading) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <div className="console-page console-zone-page">
          <ConsoleSkeleton rows={8} />
        </div>
      </ConsoleLayout>
    );
  }

  if (!zone) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <div className="console-page">
          <h1 className="console-page__title">Hosted zone not found</h1>
          <p className="console-page__muted">{error || "No hosted zone matches this ID."}</p>
          <Link href="/hosted-zones" className="console-btn console-btn--normal">
            Back to hosted zones
          </Link>
        </div>
      </ConsoleLayout>
    );
  }

  const domain = displayDomain(zone.name);
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: domain },
      ]}
    >
      <div className="console-page console-zone-page">
        {justCreated && zone ? (
          <div className="console-flash console-flash--success" role="status">
            <FiCheckCircle size={20} className="console-flash__icon" aria-hidden="true" />
            <div className="console-flash__body">
              <p className="console-flash__title">{domain} was successfully created.</p>
              <p className="console-flash__text">
                Now you can create records in the hosted zone to specify how you want Route 53 to
                route traffic for your domain.
              </p>
            </div>
            <button
              type="button"
              className="console-flash__close"
              aria-label="Dismiss notification"
              onClick={() => setJustCreated(false)}
            >
              <FiX size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}

        <div className="console-zone-header">
          <div className="console-zone-header__title-row">
            <span className="console-badge">{zone.type}</span>
            <h1 className="console-zone-header__name">{domain}</h1>
            <a href="#" className="console-link">
              Info
            </a>
          </div>
          <div className="console-zone-header__actions">
            <button
              type="button"
              className="console-btn console-btn--normal"
              disabled={busy}
              onClick={() => void onDeleteZone()}
            >
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
          <div className="console-details-panel__header-row">
            <button
              type="button"
              className="console-details-panel__toggle"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
            >
              <TriangleDownIcon size={10} extraRotateDeg={detailsOpen ? 0 : -90} />
              Hosted zone details
            </button>
            <button type="button" className="console-btn console-btn--normal">
              Edit hosted zone
            </button>
          </div>
          {detailsOpen ? (
            <div className="console-details-panel__body">
              <dl className="console-detail-grid">
                <div>
                  <dt>Domain name</dt>
                  <dd>{domain}</dd>
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
                  <dd>{zone.comment || "—"}</dd>
                </div>
                <div>
                  <dt>Record count</dt>
                  <dd>{zone.record_count}</dd>
                </div>
                <div>
                  <dt>Name servers</dt>
                  <dd className="console-table__value">
                    {records
                      .filter((r) => r.type === "NS")
                      .flatMap((r) => r.value.split(/\r?\n/).filter(Boolean))
                      .join("\n") || "—"}
                  </dd>
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
          <section className="console-zone-tab-panel" aria-label="Records">
            <div className="console-records-header">
              <h2 className="console-records-header__title">
                Records ({records.length})
                <a href="#" className="console-link">
                  Info
                </a>
              </h2>
              <div className="console-hz-toolbar__actions">
                <button
                  type="button"
                  className="console-icon-btn console-icon-btn--accent"
                  aria-label="Refresh"
                  onClick={() => void load()}
                >
                  <FiRefreshCw size={15} />
                </button>
                <button
                  type="button"
                  className="console-btn console-btn--ghost"
                  disabled={selected.length === 0 || busy}
                  onClick={() => void onDeleteRecords()}
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

            <div className="console-hz-filter-row console-zone-records-filters">
              <ConsoleSearch
                placeholder="Filter records by property or value"
                value={query}
                onChange={setQuery}
              />
              <div className="console-filter-chips">
                <label className="console-filter-chip console-filter-chip--select">
                  <span>Type</span>
                  <TriangleDownIcon size={8} />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="Filter by type"
                  >
                    <option value="all">All</option>
                    {recordTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="console-filter-chip console-filter-chip--select">
                  <span>Routing policy</span>
                  <TriangleDownIcon size={8} />
                  <select
                    value={routingFilter}
                    onChange={(e) => setRoutingFilter(e.target.value)}
                    aria-label="Filter by routing policy"
                  >
                    <option value="all">All</option>
                    <option value="Simple">Simple</option>
                  </select>
                </label>
                <label className="console-filter-chip console-filter-chip--select">
                  <span>Alias</span>
                  <TriangleDownIcon size={8} />
                  <select
                    value={aliasFilter}
                    onChange={(e) => setAliasFilter(e.target.value)}
                    aria-label="Filter by alias"
                  >
                    <option value="all">All</option>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
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

            <div className="console-table-wrap console-hz-table-wrap">
              <table className="console-table console-zone-records-table">
                <thead>
                  <tr>
                    <th className="console-hz-table__select">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all records"
                        disabled={filtered.length === 0}
                      />
                    </th>
                    <th>
                      <SortLabel>Record name</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Type</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Routing policy</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Differentiator</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Alias</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Value/Route traffic to</SortLabel>
                    </th>
                    <th>
                      <SortLabel>TTL (seconds)</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Health check ID</SortLabel>
                    </th>
                    <th>
                      <SortLabel>Evaluate target health</SortLabel>
                    </th>
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
                      <tr
                        key={record.id}
                        className={selected.includes(record.id) ? "is-selected" : undefined}
                      >
                        <td className="console-hz-table__select">
                          <input
                            type="checkbox"
                            checked={selected.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            aria-label={`Select ${displayDomain(record.name)}`}
                          />
                        </td>
                        <td>{displayDomain(record.name) || domain}</td>
                        <td>{record.type}</td>
                        <td>Simple</td>
                        <td>—</td>
                        <td>No</td>
                        <td className="console-table__value">{formatRecordValue(record)}</td>
                        <td>{record.ttl.toLocaleString()}</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "recovery" ? (
          <section className="console-zone-tab-panel console-card console-zone-info-card">
            <h2 className="console-card__title">Accelerated recovery</h2>
            <p className="console-card__intro">
              Accelerated recovery helps you restore DNS configuration more quickly after an
              outage or accidental change by keeping a recovery point for this hosted zone.
            </p>
            <dl className="console-detail-grid">
              <div>
                <dt>Status</dt>
                <dd>Not enabled</dd>
              </div>
              <div>
                <dt>Last recovery point</dt>
                <dd>—</dd>
              </div>
            </dl>
            <div className="console-zone-info-card__actions">
              <button type="button" className="console-btn console-btn--primary">
                Enable accelerated recovery
              </button>
              <a href="#" className="console-link">
                Learn more
              </a>
            </div>
          </section>
        ) : null}

        {tab === "dnssec" ? (
          <section className="console-zone-tab-panel console-card console-zone-info-card">
            <h2 className="console-card__title">DNSSEC signing</h2>
            <p className="console-card__intro">
              DNSSEC signing cryptographically signs DNS records so resolvers can verify that
              responses for {domain} have not been tampered with.
            </p>
            <dl className="console-detail-grid">
              <div>
                <dt>Signing status</dt>
                <dd>Not enabled</dd>
              </div>
              <div>
                <dt>KSK status</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt>DS record</dt>
                <dd>—</dd>
              </div>
            </dl>
            <div className="console-zone-info-card__actions">
              <button type="button" className="console-btn console-btn--primary">
                Enable DNSSEC signing
              </button>
              <a href="#" className="console-link">
                Info
              </a>
            </div>
          </section>
        ) : null}

        {tab === "tags" ? (
          <section className="console-zone-tab-panel console-hz-tags">
            <div className="console-hz-field__label-row">
              <h2 className="console-hz-config__title">Hosted zone tags</h2>
              <a href="#" className="console-link">
                Info
              </a>
            </div>
            <p className="console-hz-config__intro">
              Apply tags to this hosted zone to help organize and identify it.
            </p>
            <p className="console-hz-tags__empty">No tags associated with the resource.</p>
            <button type="button" className="console-btn console-btn--normal">
              Manage tags
            </button>
            <p className="console-hz-field__hint">You can add up to 50 tags.</p>
          </section>
        ) : null}
      </div>
    </ConsoleLayout>
  );
}
