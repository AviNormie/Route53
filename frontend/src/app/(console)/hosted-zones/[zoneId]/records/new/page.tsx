"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FiSettings } from "react-icons/fi";
import { HiChevronDown, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import {
  ConsoleField,
  ConsoleInput,
  ConsoleSearch,
  ConsoleSelect,
  ConsoleTextarea,
} from "@/components/console/ConsoleInput";
import { ConsoleSkeleton } from "@/components/console/ConsoleSkeleton";
import {
  ApiError,
  createDnsRecord,
  displayDomain,
  getHostedZone,
  listDnsRecords,
  type DnsRecord,
  type DnsRecordType,
  type HostedZone,
} from "@/lib/api";

const RECORD_TYPE_OPTIONS: { value: DnsRecordType; label: string }[] = [
  { value: "A", label: "A – Routes traffic to an IPv4 address and some AWS resources" },
  { value: "AAAA", label: "AAAA – Routes traffic to an IPv6 address and some AWS resources" },
  { value: "CNAME", label: "CNAME – Routes traffic to another domain name" },
  { value: "MX", label: "MX – Routes traffic to mail servers" },
  { value: "TXT", label: "TXT – Holds text-based verification values" },
  { value: "NS", label: "NS – Name servers for the hosted zone" },
  { value: "PTR", label: "PTR – Reverse DNS lookup" },
  { value: "SRV", label: "SRV – Service locator" },
  { value: "CAA", label: "CAA – Certificate Authority Authorization" },
];

type DraftRecord = {
  id: string;
  subdomain: string;
  type: DnsRecordType;
  alias: boolean;
  value: string;
  ttl: string;
  priority: string;
  weight: string;
  port: string;
};

function newDraft(): DraftRecord {
  return {
    id: `draft-${Math.random().toString(36).slice(2, 8)}`,
    subdomain: "",
    type: "A",
    alias: false,
    value: "192.0.2.235",
    ttl: "300",
    priority: "10",
    weight: "0",
    port: "443",
  };
}

function fqdn(subdomain: string, zoneName: string): string {
  const zone = zoneName.endsWith(".") ? zoneName : `${zoneName}.`;
  const sub = subdomain.trim().replace(/\.$/, "");
  if (!sub) return zone;
  return `${sub}.${displayDomain(zone)}.`;
}

export default function CreateRecordPage() {
  const params = useParams<{ zoneId: string }>();
  const router = useRouter();
  const zoneId = params.zoneId;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [existing, setExisting] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodOpen, setMethodOpen] = useState(true);
  const [existingOpen, setExistingOpen] = useState(true);
  const [drafts, setDrafts] = useState<DraftRecord[]>([newDraft()]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [z, recs] = await Promise.all([
          getHostedZone(zoneId),
          listDnsRecords(zoneId, { page_size: 100 }),
        ]);
        if (cancelled) return;
        setZone(z);
        setExisting(recs.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load zone.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  const filteredExisting = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return existing;
    return existing.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q),
    );
  }, [existing, query]);

  const updateDraft = (id: string, patch: Partial<DraftRecord>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setSubmitting(true);
    setError("");
    try {
      for (const draft of drafts) {
        const ttl = Number(draft.ttl);
        if (!draft.value.trim() || !Number.isFinite(ttl) || ttl < 0) {
          throw new Error("Each record needs a value and a valid TTL.");
        }

        let value = draft.value.trim();
        let priority = Number(draft.priority) || 10;

        if (draft.type === "MX") {
          const parts = value.split(/\s+/);
          if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
            priority = Number(parts[0]);
            value = parts.slice(1).join(" ");
          }
        }

        await createDnsRecord(zone.id, {
          name: fqdn(draft.subdomain, zone.name),
          type: draft.type,
          ttl,
          value,
          priority: draft.type === "MX" || draft.type === "SRV" ? priority : undefined,
          weight: draft.type === "SRV" ? Number(draft.weight) || 0 : undefined,
          port: draft.type === "SRV" ? Number(draft.port) || 0 : undefined,
          caa_flag: draft.type === "CAA" ? 0 : undefined,
          caa_tag: draft.type === "CAA" ? "issue" : undefined,
        });
      }
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create records.",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <div className="console-page" style={{ maxWidth: 960 }}>
          <ConsoleSkeleton rows={5} />
        </div>
      </ConsoleLayout>
    );
  }

  if (!zone) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <h1 className="console-page__title">Hosted zone not found</h1>
        <p className="console-page__muted">{error}</p>
      </ConsoleLayout>
    );
  }

  const domain = displayDomain(zone.name);

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: domain, href: `/hosted-zones/${zone.id}` },
        { label: "Create record" },
      ]}
    >
      <div className="console-page" style={{ maxWidth: 960 }}>
        <div className="console-details-panel">
          <button
            type="button"
            className="console-details-panel__header"
            onClick={() => setMethodOpen((v) => !v)}
            aria-expanded={methodOpen}
          >
            <span className="console-details-panel__header-left">
              <HiChevronDown
                size={14}
                style={{ transform: methodOpen ? undefined : "rotate(-90deg)" }}
              />
              Record creation method
            </span>
          </button>
          {methodOpen ? (
            <div className="console-details-panel__body">
              <div className="console-method-grid">
                <div className="console-method-card">
                  <h3>Quick create</h3>
                  <p>
                    Choose this method if you are confident in the process of creating records and
                    want to create one or more records in a single step.
                  </p>
                </div>
                <div className="console-method-card">
                  <h3>Wizard</h3>
                  <p>
                    Choose this method if you need more explanations and guidance while creating a
                    record. You can create one record at a time.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="console-page__heading-row" style={{ marginTop: "0.25rem" }}>
          <h1 className="console-page__title">Create record</h1>
          <a href="#" className="console-link">
            Info
          </a>
        </div>

        <form className="console-card" onSubmit={(e) => void onSubmit(e)} style={{ padding: "1rem" }}>
          <div className="console-quick-header">
            <h2>Quick create record</h2>
            <a href="#" className="console-link">
              Switch to wizard
            </a>
          </div>

          {drafts.map((draft, index) => (
            <div key={draft.id} className="console-record-block">
              <div className="console-record-block__header">
                <span>Record {index + 1}</span>
                <button
                  type="button"
                  className="console-btn console-btn--normal"
                  disabled={drafts.length === 1}
                  onClick={() => setDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                >
                  Delete
                </button>
              </div>

              <div className="console-form">
                <ConsoleField
                  label={
                    <span className="console-label-with-info">
                      Record name <a href="#" className="console-link">Info</a>
                    </span>
                  }
                  htmlFor={`name-${draft.id}`}
                  hint="Keep blank to create a record for the root domain."
                >
                  <div className="console-record-name-row">
                    <ConsoleInput
                      id={`name-${draft.id}`}
                      placeholder="subdomain"
                      value={draft.subdomain}
                      onChange={(e) => updateDraft(draft.id, { subdomain: e.target.value })}
                    />
                    <span className="console-record-suffix">.{domain}</span>
                  </div>
                </ConsoleField>

                <ConsoleField
                  label={
                    <span className="console-label-with-info">
                      Record type <a href="#" className="console-link">Info</a>
                    </span>
                  }
                  htmlFor={`type-${draft.id}`}
                >
                  <ConsoleSelect
                    id={`type-${draft.id}`}
                    value={draft.type}
                    onChange={(e) =>
                      updateDraft(draft.id, { type: e.target.value as DnsRecordType })
                    }
                  >
                    {RECORD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </ConsoleSelect>
                </ConsoleField>

                <div className="console-toggle">
                  <button
                    type="button"
                    className={`console-toggle__track${draft.alias ? " is-on" : ""}`}
                    aria-pressed={draft.alias}
                    onClick={() => updateDraft(draft.id, { alias: !draft.alias })}
                  >
                    <span className="console-toggle__knob" />
                  </button>
                  <span>Alias</span>
                </div>

                {(draft.type === "MX" || draft.type === "SRV") && (
                  <ConsoleField label="Priority" htmlFor={`prio-${draft.id}`}>
                    <ConsoleInput
                      id={`prio-${draft.id}`}
                      value={draft.priority}
                      onChange={(e) => updateDraft(draft.id, { priority: e.target.value })}
                    />
                  </ConsoleField>
                )}

                {draft.type === "SRV" && (
                  <>
                    <ConsoleField label="Weight" htmlFor={`weight-${draft.id}`}>
                      <ConsoleInput
                        id={`weight-${draft.id}`}
                        value={draft.weight}
                        onChange={(e) => updateDraft(draft.id, { weight: e.target.value })}
                      />
                    </ConsoleField>
                    <ConsoleField label="Port" htmlFor={`port-${draft.id}`}>
                      <ConsoleInput
                        id={`port-${draft.id}`}
                        value={draft.port}
                        onChange={(e) => updateDraft(draft.id, { port: e.target.value })}
                      />
                    </ConsoleField>
                  </>
                )}

                <ConsoleField
                  label={
                    <span className="console-label-with-info">
                      Value <a href="#" className="console-link">Info</a>
                    </span>
                  }
                  htmlFor={`value-${draft.id}`}
                  hint="Enter multiple values on separate lines."
                >
                  <ConsoleTextarea
                    id={`value-${draft.id}`}
                    rows={3}
                    value={draft.value}
                    onChange={(e) => updateDraft(draft.id, { value: e.target.value })}
                  />
                </ConsoleField>

                <ConsoleField
                  label={
                    <span className="console-label-with-info">
                      TTL (seconds) <a href="#" className="console-link">Info</a>
                    </span>
                  }
                  htmlFor={`ttl-${draft.id}`}
                  hint="Recommended values: 60 to 172800 (two days)"
                >
                  <div className="console-ttl-row">
                    <ConsoleInput
                      id={`ttl-${draft.id}`}
                      value={draft.ttl}
                      onChange={(e) => updateDraft(draft.id, { ttl: e.target.value })}
                    />
                    <button
                      type="button"
                      className={`console-pill${draft.ttl === "60" ? " is-active" : ""}`}
                      onClick={() => updateDraft(draft.id, { ttl: "60" })}
                    >
                      1m
                    </button>
                    <button
                      type="button"
                      className={`console-pill${draft.ttl === "3600" ? " is-active" : ""}`}
                      onClick={() => updateDraft(draft.id, { ttl: "3600" })}
                    >
                      1h
                    </button>
                    <button
                      type="button"
                      className={`console-pill${draft.ttl === "86400" ? " is-active" : ""}`}
                      onClick={() => updateDraft(draft.id, { ttl: "86400" })}
                    >
                      1d
                    </button>
                  </div>
                </ConsoleField>
              </div>
            </div>
          ))}

          {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="console-btn console-btn--normal"
              onClick={() => setDrafts((prev) => [...prev, newDraft()])}
            >
              Add another record
            </button>
          </div>

          <div className="console-create-actions">
            <Link href={`/hosted-zones/${zone.id}`} className="console-link">
              Cancel
            </Link>
            <button type="submit" className="console-btn console-btn--primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create records"}
            </button>
          </div>
        </form>

        <div className="console-details-panel" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="console-details-panel__header"
            onClick={() => setExistingOpen((v) => !v)}
            aria-expanded={existingOpen}
          >
            <span className="console-details-panel__header-left">
              <HiChevronDown
                size={14}
                style={{
                  color: "var(--console-link)",
                  transform: existingOpen ? undefined : "rotate(-90deg)",
                }}
              />
              View existing records
            </span>
          </button>
          {existingOpen ? (
            <div className="console-details-panel__body">
              <p className="console-page__muted" style={{ marginBottom: "0.75rem" }}>
                The following table lists the existing records in {domain}.
              </p>
              <h3 className="console-records-header__title" style={{ marginBottom: "0.75rem" }}>
                Existing records ({existing.length}){" "}
                <a href="#" className="console-link" style={{ fontSize: 13, fontWeight: 600 }}>
                  Info
                </a>
              </h3>
              <div className="console-hz-filter-row">
                <ConsoleSearch
                  placeholder="Filter records by property or value"
                  value={query}
                  onChange={setQuery}
                />
                <div className="console-table-meta">
                  <button type="button" className="console-icon-btn" aria-label="Previous page">
                    <HiChevronLeft size={14} />
                  </button>
                  <span>1</span>
                  <button type="button" className="console-icon-btn" aria-label="Next page">
                    <HiChevronRight size={14} />
                  </button>
                  <button type="button" className="console-icon-btn" aria-label="Settings">
                    <FiSettings size={14} />
                  </button>
                </div>
              </div>
              <div className="console-table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Record name</th>
                      <th>Type</th>
                      <th>Value/Route traffic to</th>
                      <th>TTL (seconds)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExisting.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="console-table__empty">
                          No records to display
                        </td>
                      </tr>
                    ) : (
                      filteredExisting.map((record) => (
                        <tr key={record.id}>
                          <td>{displayDomain(record.name)}</td>
                          <td>{record.type}</td>
                          <td className="console-table__value">{record.value}</td>
                          <td>{record.ttl.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ConsoleLayout>
  );
}
