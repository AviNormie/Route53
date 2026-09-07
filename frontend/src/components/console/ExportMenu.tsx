"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import {
  ApiError,
  exportHostedZone,
  exportHostedZones,
  type ZoneExportFormat,
} from "@/lib/api";

type ExportMenuProps = {
  /** Single zone (detail page). */
  zoneId?: string;
  /** One or more zones (list page). */
  zoneIds?: string[];
  disabled?: boolean;
  label?: string;
  className?: string;
  /** Match surrounding toolbar button style. */
  buttonVariant?: "normal" | "ghost";
  onError?: (message: string) => void;
};

export function ExportMenu({
  zoneId,
  zoneIds,
  disabled = false,
  label = "Export",
  className = "",
  buttonVariant = "normal",
  onError,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const targets =
    zoneIds && zoneIds.length > 0 ? zoneIds : zoneId ? [zoneId] : [];
  const canExport = !disabled && !busy && targets.length > 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const runExport = async (format: ZoneExportFormat) => {
    if (!canExport) return;
    setBusy(true);
    setOpen(false);
    try {
      if (targets.length === 1) {
        await exportHostedZone(targets[0], format);
      } else {
        await exportHostedZones(targets, format);
      }
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const triggerClass =
    buttonVariant === "ghost"
      ? "console-btn console-btn--ghost hz-export-menu__trigger"
      : "console-btn console-btn--normal hz-export-menu__trigger";

  return (
    <div ref={rootRef} className={`hz-export-menu ${className}`.trim()}>
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={!canExport}
        onClick={() => setOpen((value) => !value)}
      >
        {busy ? "Exporting…" : label}
        <HiChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <ul id={menuId} className="hz-export-menu__list" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => void runExport("json")}
            >
              Export as JSON
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => void runExport("bind")}
            >
              Export as BIND
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
