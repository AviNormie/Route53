"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import { ApiError, createDnsRecord, type DnsRecordType } from "@/lib/api";

type ImportRecordsPanelProps = {
  zoneId: string;
  onClose: () => void;
  onImported: () => void | Promise<void>;
};

/**
 * Minimal zone-file style importer: one record per line
 * format: NAME TYPE TTL VALUE
 */
export function ImportRecordsPanel({ zoneId, onClose, onImported }: ImportRecordsPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onImport = async () => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith(";"));
    if (lines.length === 0) {
      setError("Paste at least one record line (NAME TYPE TTL VALUE).");
      return;
    }

    setBusy(true);
    setError("");
    try {
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 4) {
          throw new Error(`Invalid line: ${line}`);
        }
        const [name, typeRaw, ttlRaw, ...valueParts] = parts;
        const type = typeRaw.toUpperCase() as DnsRecordType;
        const ttl = Number(ttlRaw);
        const value = valueParts.join(" ");
        await createDnsRecord(zoneId, { name, type, ttl, value });
      }
      await onImported();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to import records.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="hz-import-panel" role="dialog" aria-label="Import records">
        <div className="hz-import-panel__header">
          <h3>Import records</h3>
          <button type="button" aria-label="Close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <p className="hz-import-panel__help">
          Paste BIND-style lines: <code>NAME TYPE TTL VALUE</code> (one record per line).
        </p>
        <textarea
          className="console-textarea hz-import-panel__textarea"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"www.example.com. A 300 192.0.2.1\nmail.example.com. MX 300 10 mailhost.example.com."}
        />
        {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}
        <div className="hz-import-panel__actions">
          <ConsoleButton variant="link" onClick={onClose}>
            Cancel
          </ConsoleButton>
          <ConsoleButton variant="orange" disabled={busy} onClick={() => void onImport()}>
            {busy ? "Importing…" : "Import"}
          </ConsoleButton>
        </div>
      </div>
    </div>
  );
}
