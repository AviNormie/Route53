"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiSettings } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { ConsoleSkeleton } from "@/components/console/ConsoleSkeleton";
import {
  ApiError,
  deleteHostedZone,
  displayDomain,
  listHostedZones,
  type HostedZone,
} from "@/lib/api";

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setSelected((cur) => (cur && data.items.some((z) => z.id === cur) ? cur : null));
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

  const hasSelection = Boolean(selected && zones.some((z) => z.id === selected));

  const onDelete = async () => {
    if (!selected) return;
    const zone = zones.find((z) => z.id === selected);
    if (!zone) return;
    if (!window.confirm(`Delete hosted zone ${displayDomain(zone.name)}?`)) return;
    setBusy(true);
    try {
      await deleteHostedZone(selected);
      setSelected(null);
      await load(query);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete hosted zone.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsoleLayout breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}>
      <div className="console-page">
        <div className="console-hz-toolbar">
          <h1 className="console-page__title">Hosted zones ({loading ? "…" : total})</h1>
          <div className="console-hz-toolbar__actions">
            <button
              type="button"
              className="console-icon-btn"
              aria-label="Refresh"
              onClick={() => void load(query)}
            >
              <FiRefreshCw size={15} />
            </button>
            <Link
              href={hasSelection ? `/hosted-zones/${selected}` : "#"}
              className={`console-btn console-btn--ghost${hasSelection ? "" : " is-disabled"}`}
              aria-disabled={!hasSelection}
              onClick={(e) => {
                if (!hasSelection) e.preventDefault();
              }}
            >
              View details
            </Link>
            <button type="button" className="console-btn console-btn--ghost" disabled>
              Edit
            </button>
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

        <p className="console-hz-hint">
          Automatic mode is the current search behavior optimized for best filter results.{" "}
          <a href="#">To change modes go to settings.</a>
        </p>

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

        <div className="console-table-wrap" hidden={loading}>
          <table className="console-table console-table--clickable">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all" disabled={zones.length === 0} />
                </th>
                <th>
                  Hosted zone name <span className="sort-icon">⇅</span>
                </th>
                <th>
                  Type <span className="sort-icon">⇅</span>
                </th>
                <th>
                  Created by <span className="sort-icon">⇅</span>
                </th>
                <th>
                  Record count <span className="sort-icon">⇅</span>
                </th>
                <th>
                  Description <span className="sort-icon">⇅</span>
                </th>
                <th>
                  Hosted zone ID <span className="sort-icon">⇅</span>
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
                zones.map((zone) => (
                  <tr
                    key={zone.id}
                    className={selected === zone.id ? "is-selected" : undefined}
                    onClick={() => setSelected(zone.id)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected === zone.id}
                        onChange={() =>
                          setSelected((cur) => (cur === zone.id ? null : zone.id))
                        }
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
                      <code>{zone.id}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ConsoleLayout>
  );
}
