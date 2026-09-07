"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiRefreshCw, FiSettings, FiX } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { ConsoleSkeleton } from "@/components/console/ConsoleSkeleton";
import { ExportMenu } from "@/components/console/ExportMenu";
import { TriangleDownIcon } from "@/components/console/TriangleDownIcon";
import {
  ApiError,
  deleteHostedZone,
  displayDomain,
  listHostedZones,
  type HostedZone,
} from "@/lib/api";

function SortLabel({ children }: { children: string }) {
  return (
    <span className="console-hz-sort-label">
      {children}
      <TriangleDownIcon className="sort-icon" size={8} />
    </span>
  );
}

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const created = params.get("created");
    if (!created) return;
    setSuccessName(created);
    window.history.replaceState({}, "", "/hosted-zones");
  }, []);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await listHostedZones({
        search: search?.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      setZones(data.items);
      setTotal(data.total);
      setSelectedIds((cur) => {
        const next = new Set([...cur].filter((id) => data.items.some((z) => z.id === id)));
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load hosted zones.");
      setZones([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, load]);

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const hasSelection = selectedList.length > 0;
  const singleSelected = selectedList.length === 1 ? selectedList[0] : null;

  const toggleZone = (zoneId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === zones.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(zones.map((zone) => zone.id)));
  };

  const onDelete = async () => {
    if (selectedList.length === 0) return;
    const names = zones
      .filter((z) => selectedIds.has(z.id))
      .map((z) => displayDomain(z.name))
      .join(", ");
    if (!window.confirm(`Delete hosted zone${selectedList.length > 1 ? "s" : ""} ${names}?`)) {
      return;
    }
    setBusy(true);
    try {
      for (const id of selectedList) {
        await deleteHostedZone(id);
      }
      setSelectedIds(new Set());
      await load(query);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete hosted zone.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
      <div className="console-page console-hz-page">
        {successName ? (
          <div className="console-flash console-flash--success" role="status">
            <FiCheckCircle size={20} className="console-flash__icon" aria-hidden="true" />
            <div className="console-flash__body">
              <p className="console-flash__title">{successName} was successfully created.</p>
              <p className="console-flash__text">
                Now you can create records in the hosted zone to specify how you want Route 53 to
                route traffic for your domain.
              </p>
            </div>
            <button
              type="button"
              className="console-flash__close"
              aria-label="Dismiss notification"
              onClick={() => setSuccessName(null)}
            >
              <FiX size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="console-hz-toolbar">
          <div className="console-hz-toolbar__heading">
            <h1 className="console-page__title">Hosted zones ({loading ? "…" : total})</h1>
            <p className="console-hz-hint">
              Automatic mode is the current search behavior optimized for best filter results.{" "}
              <a href="#">To change modes go to settings.</a>
            </p>
          </div>
          <div className="console-hz-toolbar__actions">
            <button
              type="button"
              className="console-icon-btn console-icon-btn--accent"
              aria-label="Refresh"
              onClick={() => void load(query)}
            >
              <FiRefreshCw size={15} />
            </button>
            <Link
              href={singleSelected ? `/hosted-zones/${singleSelected}` : "#"}
              className={`console-btn console-btn--ghost${singleSelected ? "" : " is-disabled"}`}
              aria-disabled={!singleSelected}
              onClick={(e) => {
                if (!singleSelected) e.preventDefault();
              }}
            >
              View details
            </Link>
            <button type="button" className="console-btn console-btn--ghost" disabled>
              Edit
            </button>
            <ExportMenu
              zoneIds={selectedList}
              disabled={!hasSelection || busy}
              buttonVariant="ghost"
              onError={setError}
            />
            <button
              type="button"
              className="console-btn console-btn--ghost"
              disabled={!hasSelection || busy}
              onClick={() => void onDelete()}
            >
              Delete
            </button>
            <Link href="/hosted-zones/new" className="console-btn console-btn--primary">
              Create hosted zone
            </Link>
          </div>
        </div>

        {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}

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
            <button type="button" className="console-icon-btn" aria-label="Table preferences">
              <FiSettings size={14} />
            </button>
          </div>
        </div>

        {loading ? <ConsoleSkeleton rows={6} title={false} /> : null}

        <div className="console-table-wrap console-hz-table-wrap" hidden={loading}>
          <table className="console-table console-table--clickable console-hz-table">
            <thead>
              <tr>
                <th className="console-hz-table__select">
                  <input
                    type="checkbox"
                    checked={zones.length > 0 && selectedIds.size === zones.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          selectedIds.size > 0 && selectedIds.size < zones.length;
                      }
                    }}
                    onChange={toggleAll}
                    aria-label="Select all hosted zones"
                  />
                </th>
                <th>
                  <SortLabel>Hosted zone name</SortLabel>
                </th>
                <th>
                  <SortLabel>Type</SortLabel>
                </th>
                <th>
                  <SortLabel>Created by</SortLabel>
                </th>
                <th>
                  <SortLabel>Record count</SortLabel>
                </th>
                <th>
                  <SortLabel>Description</SortLabel>
                </th>
                <th>
                  <SortLabel>Hosted zone ID</SortLabel>
                </th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="console-empty-state">
                      <p className="console-empty-state__title">No hosted zones</p>
                      <p className="console-empty-state__body">
                        There are no hosted zones created for this account.
                      </p>
                      <Link href="/hosted-zones/new" className="console-btn console-btn--primary">
                        Create hosted zone
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                zones.map((zone) => {
                  const selected = selectedIds.has(zone.id);
                  return (
                    <tr
                      key={zone.id}
                      className={selected ? "is-selected" : undefined}
                      onClick={() => toggleZone(zone.id)}
                      onDoubleClick={() => {
                        window.location.href = `/hosted-zones/${zone.id}`;
                      }}
                    >
                      <td
                        className="console-hz-table__select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleZone(zone.id)}
                          aria-label={`Select ${displayDomain(zone.name)}`}
                        />
                      </td>
                      <td>
                        <Link href={`/hosted-zones/${zone.id}`} className="console-link">
                          {displayDomain(zone.name)}
                        </Link>
                      </td>
                      <td>{zone.type}</td>
                      <td>Route 53</td>
                      <td>{zone.record_count}</td>
                      <td>{zone.comment || "—"}</td>
                      <td>
                        <code className="console-hz-table__id">{zone.id}</code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ConsoleLayout>
  );
}
