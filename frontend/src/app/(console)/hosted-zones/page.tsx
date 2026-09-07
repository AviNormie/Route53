"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleSearch } from "@/components/console/ConsoleInput";
import { useMockDns } from "@/lib/mock/store";

export default function HostedZonesPage() {
  const { zones, hydrated } = useMockDns();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.id.toLowerCase().includes(q) ||
        z.description.toLowerCase().includes(q),
    );
  }, [zones, query]);

  return (
    <ConsoleLayout breadcrumb="Hosted zones">
      <div className="console-page">
        <div className="console-page__heading-row console-page__heading-row--spread">
          <h1 className="console-page__title">Hosted zones</h1>
          <Link href="/hosted-zones/new" className="console-btn console-btn--primary">
            Create hosted zone
          </Link>
        </div>

        <ConsoleCard>
          <div className="console-toolbar">
            <ConsoleSearch
              placeholder="Search hosted zones"
              value={query}
              onChange={setQuery}
            />
            <span className="console-page__muted">
              {hydrated ? `${filtered.length} zone${filtered.length === 1 ? "" : "s"}` : "Loading…"}
            </span>
          </div>

          <div className="console-table-wrap">
            <table className="console-table console-table--clickable">
              <thead>
                <tr>
                  <th>Domain name</th>
                  <th>Type</th>
                  <th>Record count</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {!hydrated ? (
                  <tr>
                    <td colSpan={4} className="console-table__empty">
                      Loading hosted zones…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="console-table__empty">
                      No hosted zones match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((zone) => (
                    <tr key={zone.id}>
                      <td>
                        <Link href={`/hosted-zones/${zone.id}`} className="console-link">
                          {zone.name}
                        </Link>
                      </td>
                      <td>{zone.type}</td>
                      <td>{zone.recordCount}</td>
                      <td>{zone.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ConsoleCard>
      </div>
    </ConsoleLayout>
  );
}
