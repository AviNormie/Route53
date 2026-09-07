"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiMinusCircle,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSkeleton } from "@/components/console/ConsoleSkeleton";
import { ExportMenu } from "@/components/console/ExportMenu";
import { ImportRecordsPanel } from "@/components/console/ImportRecordsPanel";
import { InfoLink } from "@/components/console/InfoLink";
import { PropertyFilterDropdown } from "@/components/console/PropertyFilterDropdown";
import {
  RecordDetailsPanel,
  type RecordFormState,
  type RecordPanelMode,
} from "@/components/console/RecordDetailsPanel";
import {
  ApiError,
  deleteDnsRecord,
  deleteHostedZone,
  displayDomain,
  getHostedZone,
  listDnsRecords,
  updateDnsRecord,
  type DnsRecord,
  type HostedZone,
} from "@/lib/api";
import {
  notifyHostedZoneDeleted,
  notifyRecordsChanged,
} from "@/lib/console-notifications";

const RECORD_TYPE_OPTIONS = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "PTR",
  "SRV",
  "CAA",
  "NS",
  "SOA",
].map((type) => ({ value: type, label: type }));

const ROUTING_OPTIONS = [
  { value: "Simple", label: "Simple" },
  { value: "Weighted", label: "Weighted" },
  { value: "Geolocation", label: "Geolocation" },
  { value: "Latency", label: "Latency" },
  { value: "Failover", label: "Failover" },
  { value: "Multivalue", label: "Multivalue answer" },
  { value: "IP-based", label: "IP-based" },
  { value: "Geoproximity", label: "Geoproximity location" },
];

const ALIAS_OPTIONS = [
  { value: "yes", label: "Alias" },
  { value: "no", label: "Non-alias" },
];

const TABS = ["records", "accelerated", "dnssec", "tags"] as const;
type TabId = (typeof TABS)[number];

const emptyForm: RecordFormState = {
  name: "",
  type: "A",
  value: "",
  ttl: "300",
  routingPolicy: "Simple",
  alias: false,
};

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="hz-detail-label">{label}</dt>
      <dd className={`hz-detail-value${mono ? " is-mono" : ""}`}>{value}</dd>
    </div>
  );
}

export function HostedZoneDetailView({ zoneId }: { zoneId: string }) {
  const router = useRouter();
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [routingFilter, setRoutingFilter] = useState("all");
  const [aliasFilter, setAliasFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>("records");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [acceleratedEnabled, setAcceleratedEnabled] = useState(false);
  const [dnssecEnabled, setDnssecEnabled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelMode, setPanelMode] = useState<RecordPanelMode>("details");
  const [successKind, setSuccessKind] = useState<"created" | "updated" | null>(null);
  const [editing, setEditing] = useState<DnsRecord | null>(null);
  const [form, setForm] = useState<RecordFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [busy, setBusy] = useState(false);
  const prevSelectedKey = useRef("");

  const load = useCallback(async () => {
    setLoadingDetail(true);
    setError(null);
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
      setLoadingDetail(false);
    }
  }, [zoneId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("created") === "1") {
        setSuccessKind("created");
        window.history.replaceState({}, "", `/hosted-zones/${zoneId}`);
      } else if (params.get("updated") === "1") {
        setSuccessKind("updated");
        window.history.replaceState({}, "", `/hosted-zones/${zoneId}`);
      }
    } catch {
      /* ignore */
    }
  }, [zoneId]);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const q = query.trim().toLowerCase();
      if (
        q &&
        !record.name.toLowerCase().includes(q) &&
        !record.value.toLowerCase().includes(q) &&
        !record.type.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== "all" && record.type !== typeFilter) return false;
      if (routingFilter !== "all" && routingFilter !== "Simple") return false;
      if (aliasFilter === "yes") return false;
      return true;
    });
  }, [aliasFilter, query, records, routingFilter, typeFilter]);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.has(record.id)),
    [records, selectedIds],
  );

  const selectedKey = Array.from(selectedIds).sort().join(",");

  useEffect(() => {
    if (selectedIds.size >= 1) {
      if (prevSelectedKey.current !== selectedKey) {
        setPanelCollapsed(false);
        setHelpOpen(false);
        setPanelMode("details");
        setEditing(null);
      }
    } else {
      setPanelCollapsed(false);
      setPanelMode("details");
      setEditing(null);
    }
    prevSelectedKey.current = selectedKey;
  }, [selectedIds.size, selectedKey]);

  if (loadingDetail) {
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
          <p className="console-page__muted">
            {error || "The requested hosted zone does not exist."}
          </p>
          <div style={{ marginTop: "1rem" }}>
            <ConsoleButton href="/hosted-zones">Back to hosted zones</ConsoleButton>
          </div>
        </div>
      </ConsoleLayout>
    );
  }

  const domain = displayDomain(zone.name);
  const recordCount = records.length;
  const showRecordPanel = selectedIds.size > 0;
  const nsRecord = records.find((record) => record.type === "NS");
  const deleteDisabled =
    selectedIds.size === 0 ||
    selectedRecords.some(
      (record) =>
        record.type === "NS" && displayDomain(record.name) === domain,
    );

  const tabLabels: Record<TabId, string> = {
    records: `Records (${recordCount})`,
    accelerated: "Accelerated recovery",
    dnssec: "DNSSEC signing",
    tags: "Hosted zone tags (0)",
  };

  const openEdit = (record: DnsRecord) => {
    setEditing(record);
    setPanelCollapsed(false);
    setPanelMode("edit");
    setForm({
      name: record.name,
      type: record.type,
      value: record.value,
      ttl: String(record.ttl),
      routingPolicy: "Simple",
      alias: false,
    });
    setError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ttl = Number(form.ttl);
    if (!form.name.trim()) {
      setError("Enter a record name.");
      return;
    }
    if (!form.value.trim()) {
      setError("Enter a record value.");
      return;
    }
    if (!Number.isFinite(ttl) || ttl < 0) {
      setError("Enter a valid TTL.");
      return;
    }
    if (!editing) return;

    setBusy(true);
    setError(null);
    try {
      await updateDnsRecord(editing.id, {
        name: form.name,
        type: editing.type,
        value: form.value,
        ttl,
      });
      notifyRecordsChanged({
        zoneName: domain,
        zoneId: zone.id,
        action: "updated",
        recordLabel: `${editing.type} record ${displayDomain(form.name)}`,
      });
      setEditing(null);
      setPanelMode("details");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save record");
    } finally {
      setBusy(false);
    }
  };

  const toggleRecord = (recordId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filtered.map((record) => record.id)));
  };

  const confirmDeleteSelected = async () => {
    setBusy(true);
    setError(null);
    try {
      const deletedCount = selectedIds.size;
      for (const id of Array.from(selectedIds)) {
        await deleteDnsRecord(id);
      }
      notifyRecordsChanged({
        zoneName: domain,
        zoneId: zone.id,
        action: "deleted",
        count: deletedCount,
      });
      setSelectedIds(new Set());
      setPendingDelete(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete records");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteZone = async () => {
    if (!window.confirm(`Delete hosted zone ${domain}?`)) return;
    setBusy(true);
    try {
      await deleteHostedZone(zone.id);
      notifyHostedZoneDeleted(domain);
      router.push("/hosted-zones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete hosted zone");
      setBusy(false);
    }
  };

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: domain },
      ]}
    >
      <div className="hz-detail-shell">
        <div className="hz-detail-layout">
          <div className="hz-detail-main">
            {successKind === "updated" ? (
              <div role="status" className="hz-flash hz-flash--success">
                <span className="hz-flash__icon">
                  <FiCheck size={14} strokeWidth={3} />
                </span>
                <div className="hz-flash__body">
                  <p className="hz-flash__title">{domain} was successfully updated.</p>
                  <p className="hz-flash__text">Hosted zone details were successfully updated.</p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="hz-flash__close"
                  onClick={() => setSuccessKind(null)}
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : null}

            {successKind === "created" ? (
              <div role="status" className="hz-flash hz-flash--success">
                <span className="hz-flash__icon">
                  <FiCheck size={14} strokeWidth={3} />
                </span>
                <div className="hz-flash__body">
                  <p className="hz-flash__title">{domain} was successfully created.</p>
                  <p className="hz-flash__text">
                    Now you can create records in the hosted zone to specify how you want Route
                    53 to route traffic for your domain.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="hz-flash__close"
                  onClick={() => setSuccessKind(null)}
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : null}

            <div className="hz-detail-header">
              <div>
                <span className="console-badge">{zone.type}</span>
                <div className="hz-detail-header__title-row">
                  <h1 className="hz-detail-header__name">{domain}</h1>
                  <InfoLink onClick={() => setHelpOpen(true)} />
                </div>
              </div>
              <div className="hz-detail-header__actions">
                <ExportMenu
                  zoneId={zoneId}
                  disabled={busy}
                  onError={(message) => setError(message)}
                />
                <ConsoleButton variant="normal" disabled={busy} onClick={() => void onDeleteZone()}>
                  Delete zone
                </ConsoleButton>
                <ConsoleButton variant="normal">Test record</ConsoleButton>
                <ConsoleButton variant="normal">Configure query logging</ConsoleButton>
              </div>
            </div>

            <div className="hz-details-accordion">
              <div className="hz-details-accordion__bar">
                <button
                  type="button"
                  className="hz-details-accordion__toggle"
                  onClick={() => setDetailsOpen((v) => !v)}
                  aria-expanded={detailsOpen}
                >
                  <FiChevronRight
                    className={detailsOpen ? "is-open" : undefined}
                    size={16}
                  />
                  Hosted zone details
                </button>
                <ConsoleButton variant="normal" href={`/hosted-zones/${zoneId}`}>
                  Edit hosted zone
                </ConsoleButton>
              </div>
              {detailsOpen ? (
                <div className="hz-details-accordion__body">
                  <div className="hz-details-grid">
                    <div className="hz-details-col">
                      <DetailItem label="Hosted zone name" value={domain} />
                      <DetailItem label="Hosted zone ID" value={zone.id} mono />
                      <DetailItem label="Description" value={zone.comment || "—"} />
                    </div>
                    <div className="hz-details-col">
                      <DetailItem label="Query log" value="-" />
                      <DetailItem label="Type" value={`${zone.type} hosted zone`} />
                      <DetailItem label="Record count" value={String(recordCount)} />
                    </div>
                    <div>
                      <dt className="hz-detail-label">Name servers</dt>
                      <dd className="hz-detail-value hz-ns-list">
                        {(nsRecord?.value.split(/\r?\n/).filter(Boolean) ?? ["—"]).map((ns) => (
                          <div key={ns}>{ns}</div>
                        ))}
                      </dd>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="hz-tabs" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`hz-tab${activeTab === tab ? " is-active" : ""}`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            {activeTab === "records" ? (
              <div className="hz-records">
                {error && panelMode !== "edit" && !pendingDelete ? (
                  <p className="console-inline-msg console-inline-msg--error" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="hz-records__toolbar">
                  <div className="hz-records__heading">
                    <h2>
                      Records (
                      {selectedIds.size > 0
                        ? `${selectedIds.size}/${recordCount}`
                        : recordCount}
                      )
                    </h2>
                    <InfoLink onClick={() => setHelpOpen(true)} />
                  </div>
                  <div className="hz-records__actions">
                    <button
                      type="button"
                      aria-label="Refresh"
                      className="hz-refresh-btn"
                      disabled={busy}
                      onClick={() => void load()}
                    >
                      <FiRefreshCw size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={deleteDisabled || busy}
                      onClick={() => setPendingDelete(true)}
                      className="hz-btn-grey"
                    >
                      Delete record
                    </button>
                    <ConsoleButton
                      variant="normal"
                      disabled={busy}
                      onClick={() => setImportOpen(true)}
                    >
                      Import records
                    </ConsoleButton>
                    <ConsoleButton
                      variant="orange"
                      href={`/hosted-zones/${zoneId}/records/new`}
                    >
                      Create record
                    </ConsoleButton>
                  </div>
                </div>

                <div className="hz-records__filters">
                  <label className="hz-filter-search">
                    <span className="sr-only">Filter records</span>
                    <FiSearch className="hz-filter-search__icon" size={14} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter records by property or value"
                      className="hz-filter-input"
                    />
                  </label>
                  <PropertyFilterDropdown
                    label="Type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={RECORD_TYPE_OPTIONS}
                    widthClass="w-[200px]"
                  />
                  <PropertyFilterDropdown
                    label="Routing policy"
                    value={routingFilter}
                    onChange={setRoutingFilter}
                    options={ROUTING_OPTIONS}
                    widthClass="w-[240px]"
                  />
                  <PropertyFilterDropdown
                    label="Alias"
                    value={aliasFilter}
                    onChange={setAliasFilter}
                    options={ALIAS_OPTIONS}
                    widthClass="w-[180px]"
                  />
                  <div className="hz-records__pager">
                    <button type="button" aria-label="Previous page" disabled>
                      <FiChevronLeft size={16} />
                    </button>
                    <span>1</span>
                    <button type="button" aria-label="Next page" disabled>
                      <FiChevronRight size={16} />
                    </button>
                    <button type="button" aria-label="Table settings">
                      <FiSettings size={16} />
                    </button>
                  </div>
                </div>

                <p className="hz-auto-mode">
                  Automatic mode is the current search behavior optimized for best filter
                  results.{" "}
                  <a href="#">To change modes go to settings.</a>
                </p>

                <div className="hz-table-wrap">
                  <table className="hz-table hz-records-table">
                    <thead>
                      <tr>
                        <th className="hz-check-col">
                          <input
                            type="checkbox"
                            checked={
                              filtered.length > 0 && selectedIds.size === filtered.length
                            }
                            ref={(el) => {
                              if (el) {
                                el.indeterminate =
                                  selectedIds.size > 0 &&
                                  selectedIds.size < filtered.length;
                              }
                            }}
                            onChange={toggleAll}
                            aria-label="Select all records"
                          />
                        </th>
                        {[
                          "Record name",
                          "Type",
                          "Routing policy",
                          "Differentiator",
                          "Alias",
                          "Value/Route traffic to",
                          "TTL (seconds)",
                          "Health check ID",
                          "Evaluate target health",
                        ].map((column) => (
                          <th key={column}>
                            <span className="hz-th-label">
                              {column}
                              <FiChevronDown size={14} aria-hidden="true" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="hz-table__empty">
                            No records to display
                          </td>
                        </tr>
                      ) : (
                        filtered.map((record) => {
                          const selected = selectedIds.has(record.id);
                          return (
                            <tr
                              key={record.id}
                              data-selected={selected ? "true" : undefined}
                              onClick={() => setSelectedIds(new Set([record.id]))}
                            >
                              <td onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleRecord(record.id)}
                                  aria-label={`Select ${displayDomain(record.name)}`}
                                />
                              </td>
                              <td>{displayDomain(record.name) || domain}</td>
                              <td>{record.type}</td>
                              <td>Simple</td>
                              <td>-</td>
                              <td>No</td>
                              <td className="hz-table__value">{record.value}</td>
                              <td>{record.ttl.toLocaleString("en-US")}</td>
                              <td>-</td>
                              <td>-</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "accelerated" ? (
              <section className="hz-feature-panel" aria-labelledby="hz-accelerated-heading">
                <div className="hz-feature-panel__header">
                  <div className="hz-feature-panel__title-row">
                    <h2 id="hz-accelerated-heading">Accelerated recovery</h2>
                    <InfoLink onClick={() => setHelpOpen(true)} />
                  </div>
                  <ConsoleButton
                    variant="normal"
                    disabled={busy || acceleratedEnabled}
                    onClick={() => setAcceleratedEnabled(true)}
                  >
                    Enable
                  </ConsoleButton>
                </div>
                <p className="hz-feature-panel__copy">
                  Enable the accelerated recovery option to ensure that you can continue to make
                  changes to your public DNS records after an impairment to US East (N.
                  Virginia).
                </p>
                <dl className="hz-feature-status">
                  <dt>Status</dt>
                  <dd>
                    {acceleratedEnabled ? (
                      <>
                        <FiCheck className="hz-feature-status__icon is-enabled" size={16} aria-hidden />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <FiMinusCircle
                          className="hz-feature-status__icon"
                          size={16}
                          aria-hidden
                        />
                        <span>Disabled</span>
                      </>
                    )}
                  </dd>
                </dl>
              </section>
            ) : activeTab === "dnssec" ? (
              <section className="hz-feature-panel" aria-labelledby="hz-dnssec-heading">
                <div className="hz-feature-panel__header">
                  <div className="hz-feature-panel__title-row">
                    <h2 id="hz-dnssec-heading">DNSSEC signing</h2>
                    <InfoLink onClick={() => setHelpOpen(true)} />
                  </div>
                  <ConsoleButton
                    variant="normal"
                    disabled={busy || dnssecEnabled}
                    onClick={() => setDnssecEnabled(true)}
                  >
                    Enable DNSSEC signing
                  </ConsoleButton>
                </div>
                <p className="hz-feature-panel__copy">
                  DNSSEC signing lets you protect your domain against DNS spoofing and
                  man-in-the-middle attacks by cryptographically signing your DNS records.
                </p>
                <dl className="hz-feature-status">
                  <dt>DNSSEC signing</dt>
                  <dd>
                    {dnssecEnabled ? (
                      <>
                        <FiCheck className="hz-feature-status__icon is-enabled" size={16} aria-hidden />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <FiMinusCircle
                          className="hz-feature-status__icon"
                          size={16}
                          aria-hidden
                        />
                        <span>Disabled</span>
                      </>
                    )}
                  </dd>
                </dl>
                {dnssecEnabled ? (
                  <dl className="hz-feature-status">
                    <dt>Key-signing keys (KSKs)</dt>
                    <dd>
                      <span>1 active KSK (demo)</span>
                    </dd>
                  </dl>
                ) : (
                  <p className="hz-feature-panel__hint">
                    After you enable signing, create a key-signing key (KSK) and establish a chain
                    of trust with your domain registrar.
                  </p>
                )}
              </section>
            ) : activeTab === "tags" ? (
              <section className="hz-feature-panel" aria-labelledby="hz-tags-heading">
                <div className="hz-feature-panel__header">
                  <div className="hz-feature-panel__title-row">
                    <h2 id="hz-tags-heading">Tags</h2>
                    <InfoLink onClick={() => setHelpOpen(true)} />
                  </div>
                  <ConsoleButton variant="normal">Manage tags</ConsoleButton>
                </div>
                <p className="hz-feature-panel__copy">
                  Apply tags to hosted zones to help organize and identify your resources.
                </p>
                <p className="hz-feature-panel__empty">No tags associated with the resource.</p>
              </section>
            ) : null}
          </div>

          {showRecordPanel && !panelCollapsed ? (
            <RecordDetailsPanel
              selected={selectedRecords}
              mode={panelMode}
              form={form}
              error={error}
              onCollapse={() => {
                setPanelCollapsed(true);
                setPanelMode("details");
                setEditing(null);
              }}
              onEdit={() => {
                const record = selectedRecords[0];
                if (record) openEdit(record);
              }}
              onCancelEdit={() => {
                setEditing(null);
                setPanelMode("details");
                setError(null);
              }}
              onFormChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
              onSave={(event) => void onSubmit(event)}
              saving={busy}
            />
          ) : null}

          {helpOpen ? (
            <>
              <button
                type="button"
                aria-label="Close info panel"
                className="hz-help-backdrop"
                onClick={() => setHelpOpen(false)}
              />
              <aside className="hz-help-panel" aria-label="Hosted zone help">
                <div className="hz-help-panel__header">
                  <h2>Hosted zone details</h2>
                  <button
                    type="button"
                    aria-label="Close info panel"
                    onClick={() => setHelpOpen(false)}
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
                <div className="hz-help-panel__body">
                  <p>The details page for a hosted zone include the following information:</p>
                  <ul>
                    <li>
                      <strong>Hosted zone ID:</strong> The ID that Route 53 assigned to the
                      hosted zone when you created it.
                    </li>
                    <li>
                      <strong>Description:</strong> The description that you entered when you
                      created the hosted zone, if any.
                    </li>
                    <li>
                      <strong>Type:</strong> Whether this is a public or private hosted zone.
                    </li>
                    <li>
                      <strong>Name servers:</strong> The four name servers that Route 53
                      assigned to the hosted zone.
                    </li>
                  </ul>
                  <p>
                    If you want to make Route 53 the DNS service for a domain, update the name
                    server records with your domain registrar to use these name servers.
                  </p>
                </div>
              </aside>
            </>
          ) : null}
        </div>

        {showRecordPanel && panelCollapsed ? (
          <div className="rd-collapsed-bar">
            <p>Record details</p>
            <button
              type="button"
              aria-label="Expand record panel"
              onClick={() => setPanelCollapsed(false)}
            >
              <FiChevronUp size={20} />
            </button>
          </div>
        ) : null}

        {pendingDelete ? (
          <div className="hz-modal-backdrop">
            <div className="hz-modal" role="dialog" aria-label="Delete record">
              <h3>Delete record</h3>
              <p>
                Delete {selectedIds.size} selected record
                {selectedIds.size === 1 ? "" : "s"}? This cannot be undone.
              </p>
              <div className="hz-modal__actions">
                <ConsoleButton variant="link" onClick={() => setPendingDelete(false)}>
                  Cancel
                </ConsoleButton>
                <ConsoleButton
                  variant="orange"
                  disabled={busy}
                  onClick={() => void confirmDeleteSelected()}
                >
                  Delete
                </ConsoleButton>
              </div>
            </div>
          </div>
        ) : null}

        {importOpen ? (
          <ImportRecordsPanel
            zoneId={zoneId}
            zoneName={domain}
            onClose={() => setImportOpen(false)}
            onImported={async () => {
              await load();
            }}
          />
        ) : null}
      </div>
    </ConsoleLayout>
  );
}
