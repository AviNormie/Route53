"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import {
  ConsoleField,
  ConsoleInput,
  ConsoleSearch,
  ConsoleSelect,
  ConsoleTextarea,
} from "@/components/console/ConsoleInput";
import type { DnsRecordType, MockDnsRecord } from "@/lib/mock/records";
import { useMockDns } from "@/lib/mock/store";

const RECORD_TYPES: DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "SRV",
  "CAA",
];

const emptyForm = {
  name: "",
  type: "A" as DnsRecordType,
  value: "",
  ttl: "300",
  routingPolicy: "Simple",
};

export default function HostedZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  const router = useRouter();
  const zoneId = params.zoneId;
  const {
    hydrated,
    getZone,
    getRecordsForZone,
    createRecord,
    updateRecord,
    deleteRecord,
    deleteZone,
  } = useMockDns();

  const zone = getZone(zoneId);
  const records = getRecordsForZone(zoneId);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MockDnsRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q)
      );
    });
  }, [records, query, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      name: zone?.name ?? "",
    });
    setError("");
    setEditorOpen(true);
  };

  const openEdit = (record: MockDnsRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      type: record.type,
      value: record.value,
      ttl: String(record.ttl),
      routingPolicy: record.routingPolicy,
    });
    setError("");
    setEditorOpen(true);
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    const ttl = Number(form.ttl);
    if (!form.name.trim() || !form.value.trim() || !Number.isFinite(ttl) || ttl < 0) {
      setError("Name, value, and a valid TTL are required.");
      return;
    }
    if (editing) {
      updateRecord({
        id: editing.id,
        name: form.name,
        type: form.type,
        value: form.value,
        ttl,
        routingPolicy: form.routingPolicy,
      });
    } else {
      createRecord({
        zoneId,
        name: form.name,
        type: form.type,
        value: form.value,
        ttl,
        routingPolicy: form.routingPolicy,
      });
    }
    setEditorOpen(false);
    setEditing(null);
  };

  const onDeleteZone = () => {
    if (!zone) return;
    if (!window.confirm(`Delete hosted zone ${zone.name}? This cannot be undone (mock).`)) return;
    deleteZone(zone.id);
    router.push("/hosted-zones");
  };

  if (!hydrated) {
    return (
      <ConsoleLayout breadcrumb="Hosted zones">
        <div className="console-page">
          <p className="console-page__muted">Loading hosted zone…</p>
        </div>
      </ConsoleLayout>
    );
  }

  if (!zone) {
    return (
      <ConsoleLayout breadcrumb="Hosted zones">
        <div className="console-page">
          <h1 className="console-page__title">Hosted zone not found</h1>
          <p className="console-page__muted">
            No hosted zone matches <code>{zoneId}</code>.
          </p>
          <Link href="/hosted-zones" className="console-btn console-btn--normal">
            Back to hosted zones
          </Link>
        </div>
      </ConsoleLayout>
    );
  }

  return (
    <ConsoleLayout breadcrumb={zone.name}>
      <div className="console-page">
        <div className="console-page__heading-row console-page__heading-row--spread">
          <div>
            <p className="console-page__eyebrow">
              <Link href="/hosted-zones" className="console-link">
                Hosted zones
              </Link>
            </p>
            <h1 className="console-page__title">{zone.name}</h1>
          </div>
          <ConsoleButton variant="normal" onClick={onDeleteZone}>
            Delete hosted zone
          </ConsoleButton>
        </div>

        <ConsoleCard title="Hosted zone details">
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
        </ConsoleCard>

        <ConsoleCard
          title="Records"
          actions={
            <ConsoleButton variant="primary" onClick={openCreate}>
              Create record
            </ConsoleButton>
          }
        >
          <div className="console-toolbar">
            <ConsoleSearch placeholder="Search records" value={query} onChange={setQuery} />
            <ConsoleSelect
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="console-select--sm"
            >
              <option value="ALL">All record types</option>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </ConsoleSelect>
          </div>

          <div className="console-table-wrap">
            <table className="console-table">
              <thead>
                <tr>
                  <th>Record name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>TTL</th>
                  <th>Routing policy</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="console-table__empty">
                      No records to display
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id}>
                      <td>{record.name}</td>
                      <td>{record.type}</td>
                      <td className="console-table__value">{record.value}</td>
                      <td>{record.ttl}</td>
                      <td>{record.routingPolicy}</td>
                      <td>
                        <div className="console-row-actions">
                          <button
                            type="button"
                            className="console-link-btn"
                            onClick={() => openEdit(record)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="console-link-btn"
                            onClick={() => {
                              if (window.confirm(`Delete record ${record.name} (${record.type})?`)) {
                                deleteRecord(record.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ConsoleCard>

        {editorOpen ? (
          <div className="console-modal" role="dialog" aria-modal="true" aria-labelledby="rec-editor-title">
            <div className="console-modal__panel">
              <h2 id="rec-editor-title" className="console-page__title">
                {editing ? "Edit record" : "Create record"}
              </h2>
              <form className="console-form" onSubmit={onSave}>
                <ConsoleField label="Record name" htmlFor="rec-name">
                  <ConsoleInput
                    id="rec-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </ConsoleField>
                <ConsoleField label="Record type" htmlFor="rec-type">
                  <ConsoleSelect
                    id="rec-type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as DnsRecordType }))
                    }
                  >
                    {RECORD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </ConsoleSelect>
                </ConsoleField>
                <ConsoleField label="Value" htmlFor="rec-value">
                  <ConsoleTextarea
                    id="rec-value"
                    rows={3}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  />
                </ConsoleField>
                <ConsoleField label="TTL (seconds)" htmlFor="rec-ttl">
                  <ConsoleInput
                    id="rec-ttl"
                    value={form.ttl}
                    onChange={(e) => setForm((f) => ({ ...f, ttl: e.target.value }))}
                  />
                </ConsoleField>
                <ConsoleField label="Routing policy" htmlFor="rec-policy">
                  <ConsoleInput
                    id="rec-policy"
                    value={form.routingPolicy}
                    onChange={(e) => setForm((f) => ({ ...f, routingPolicy: e.target.value }))}
                  />
                </ConsoleField>
                {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}
                <div className="console-form__actions">
                  <ConsoleButton
                    variant="normal"
                    onClick={() => {
                      setEditorOpen(false);
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </ConsoleButton>
                  <ConsoleButton type="submit" variant="primary">
                    {editing ? "Save" : "Create record"}
                  </ConsoleButton>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </ConsoleLayout>
  );
}
