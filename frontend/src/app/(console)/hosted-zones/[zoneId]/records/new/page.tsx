"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
import { RECORD_TYPE_OPTIONS, type DnsRecordType } from "@/lib/mock/records";
import { useMockDns } from "@/lib/mock/store";

type DraftRecord = {
  id: string;
  subdomain: string;
  type: DnsRecordType;
  alias: boolean;
  value: string;
  ttl: string;
  routingPolicy: string;
};

function newDraft(): DraftRecord {
  return {
    id: `draft-${Math.random().toString(36).slice(2, 8)}`,
    subdomain: "",
    type: "A",
    alias: false,
    value: "192.0.2.235",
    ttl: "300",
    routingPolicy: "Simple routing",
  };
}

export default function CreateRecordPage() {
  const params = useParams<{ zoneId: string }>();
  const router = useRouter();
  const zoneId = params.zoneId;
  const { hydrated, getZone, getRecordsForZone, createRecord } = useMockDns();
  const zone = getZone(zoneId);
  const existing = getRecordsForZone(zoneId);

  const [methodOpen, setMethodOpen] = useState(true);
  const [existingOpen, setExistingOpen] = useState(true);
  const [drafts, setDrafts] = useState<DraftRecord[]>([newDraft()]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

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

  if (!hydrated) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <p className="console-page__muted">Loading…</p>
      </ConsoleLayout>
    );
  }

  if (!zone) {
    return (
      <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
        <h1 className="console-page__title">Hosted zone not found</h1>
      </ConsoleLayout>
    );
  }

  const updateDraft = (id: string, patch: Partial<DraftRecord>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    for (const draft of drafts) {
      const ttl = Number(draft.ttl);
      if (!draft.value.trim() || !Number.isFinite(ttl) || ttl < 0) {
        setError("Each record needs a value and a valid TTL.");
        return;
      }
      const name = draft.subdomain.trim()
        ? `${draft.subdomain.trim()}.${zone.name}`
        : zone.name;
      createRecord({
        zoneId: zone.id,
        name,
        type: draft.type,
        value: draft.value.trim(),
        ttl,
        routingPolicy: draft.routingPolicy.replace(/ routing$/i, "") || "Simple",
      });
    }
    router.push(`/hosted-zones/${zone.id}`);
  };

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: zone.name, href: `/hosted-zones/${zone.id}` },
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

        <form className="console-card" onSubmit={onSubmit} style={{ padding: "1rem" }}>
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
                    <span className="console-record-suffix">.{zone.name}</span>
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

                <ConsoleField
                  label={
                    <span className="console-label-with-info">
                      Routing policy <a href="#" className="console-link">Info</a>
                    </span>
                  }
                  htmlFor={`policy-${draft.id}`}
                >
                  <ConsoleSelect
                    id={`policy-${draft.id}`}
                    value={draft.routingPolicy}
                    onChange={(e) => updateDraft(draft.id, { routingPolicy: e.target.value })}
                  >
                    <option>Simple routing</option>
                    <option>Weighted routing</option>
                    <option>Latency routing</option>
                    <option>Failover routing</option>
                    <option>Geolocation routing</option>
                  </ConsoleSelect>
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
            <button type="submit" className="console-btn console-btn--primary">
              Create records
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
                The following table lists the existing records in {zone.name}.
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
                  <button type="button" className="console-icon-btn" aria-label="Settings">
                    <FiSettings size={14} />
                  </button>
                </div>
              </div>
              <div className="console-table-wrap">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" disabled aria-label="Select all" />
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
                      <th>Record ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExisting.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <input type="checkbox" aria-label={`Select ${record.name}`} />
                        </td>
                        <td>{record.name}</td>
                        <td>{record.type}</td>
                        <td>{record.routingPolicy}</td>
                        <td>—</td>
                        <td>No</td>
                        <td className="console-table__value">{record.value}</td>
                        <td>{record.ttl.toLocaleString()}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                          <code>{record.id}</code>
                        </td>
                      </tr>
                    ))}
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
