"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiRefreshCw, FiSettings } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { useMockDns } from "@/lib/mock/store";

export default function HostedZonesPage() {
  const { zones, hydrated } = useMockDns();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.id.toLowerCase().includes(q) ||
        z.description.toLowerCase().includes(q) ||
        z.type.toLowerCase().includes(q),
    );
  }, [zones, query]);

  const hasSelection = Boolean(selected && filtered.some((z) => z.id === selected));

  return (
    <ConsoleLayout
      breadcrumbs={[{ label: "Hosted zones", href: "/hosted-zones" }]}
    >
      <div className="console-page">
        <div className="console-hz-toolbar">
          <h1 className="console-page__title">Hosted zones ({hydrated ? zones.length : "…"})</h1>
          <div className="console-hz-toolbar__actions">
            <button type="button" className="console-icon-btn" aria-label="Refresh">
              <FiRefreshCw size={15} />
            </button>
            <button type="button" className="console-btn console-btn--ghost" disabled={!hasSelection}>
              View details
            </button>
            <button type="button" className="console-btn console-btn--ghost" disabled={!hasSelection}>
              Edit
            </button>
            <button type="button" className="console-btn console-btn--ghost" disabled={!hasSelection}>
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

        <div className="console-table-wrap">
          <table className="console-table console-table--clickable">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all" disabled={filtered.length === 0} />
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
              {!hydrated ? (
                <tr>
                  <td colSpan={7} className="console-table__empty">
                    Loading hosted zones…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
                filtered.map((zone) => (
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
                        aria-label={`Select ${zone.name}`}
                      />
                    </td>
                    <td>
                      <Link href={`/hosted-zones/${zone.id}`} className="console-link">
                        {zone.name}
                      </Link>
                    </td>
                    <td>{zone.type}</td>
                    <td>{zone.createdBy ?? "Route 53"}</td>
                    <td>{zone.recordCount}</td>
                    <td>{zone.description || "—"}</td>
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
