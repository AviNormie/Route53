"use client";

import type { FormEvent } from "react";
import { HiChevronRight } from "react-icons/hi";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import type { DnsRecord, DnsRecordType } from "@/lib/api";
import { displayDomain } from "@/lib/api";

export type RecordPanelMode = "details" | "edit";

export type RecordFormState = {
  name: string;
  type: DnsRecordType | string;
  value: string;
  ttl: string;
  routingPolicy: string;
  alias: boolean;
};

type RecordDetailsPanelProps = {
  selected: DnsRecord[];
  mode: RecordPanelMode;
  form: RecordFormState;
  error: string | null;
  onCollapse: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onFormChange: (patch: Partial<RecordFormState>) => void;
  onSave: (event: FormEvent) => void;
  saving?: boolean;
};

export function RecordDetailsPanel({
  selected,
  mode,
  form,
  error,
  onCollapse,
  onEdit,
  onCancelEdit,
  onFormChange,
  onSave,
  saving = false,
}: RecordDetailsPanelProps) {
  const record = selected[0];
  if (!record) return null;

  return (
    <aside className="rd-panel" aria-label="Record details">
      <div className="rd-panel__header">
        <h2 className="rd-panel__title">
          {mode === "edit" ? "Edit record" : "Record details"}
        </h2>
        <button type="button" className="rd-panel__collapse" aria-label="Collapse" onClick={onCollapse}>
          <HiChevronRight size={18} />
        </button>
      </div>

      <div className="rd-panel__body">
        {mode === "details" ? (
          <>
            <dl className="rd-panel__meta">
              <div>
                <dt>Record name</dt>
                <dd>{displayDomain(record.name)}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{record.type}</dd>
              </div>
              <div>
                <dt>Routing policy</dt>
                <dd>Simple</dd>
              </div>
              <div>
                <dt>Alias</dt>
                <dd>No</dd>
              </div>
              <div>
                <dt>Value/Route traffic to</dt>
                <dd className="rd-panel__value">{record.value}</dd>
              </div>
              <div>
                <dt>TTL (seconds)</dt>
                <dd>{record.ttl.toLocaleString("en-US")}</dd>
              </div>
            </dl>
            {selected.length === 1 ? (
              <div className="rd-panel__actions">
                <ConsoleButton variant="normal" onClick={onEdit}>
                  Edit record
                </ConsoleButton>
              </div>
            ) : (
              <p className="rd-panel__hint">{selected.length} records selected</p>
            )}
          </>
        ) : (
          <form className="rd-panel__form" onSubmit={onSave}>
            <label className="rd-field">
              <span>Record name</span>
              <input
                className="console-input"
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
              />
            </label>
            <label className="rd-field">
              <span>Type</span>
              <input className="console-input" value={form.type} disabled />
            </label>
            <label className="rd-field">
              <span>Value</span>
              <textarea
                className="console-textarea"
                rows={4}
                value={form.value}
                onChange={(e) => onFormChange({ value: e.target.value })}
              />
            </label>
            <label className="rd-field">
              <span>TTL (seconds)</span>
              <input
                className="console-input"
                value={form.ttl}
                onChange={(e) => onFormChange({ ttl: e.target.value })}
              />
            </label>
            {error ? (
              <p className="console-inline-msg console-inline-msg--error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="rd-panel__actions">
              <ConsoleButton variant="link" type="button" onClick={onCancelEdit}>
                Cancel
              </ConsoleButton>
              <ConsoleButton variant="orange" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </ConsoleButton>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
