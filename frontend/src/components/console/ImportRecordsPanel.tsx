"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import {
  ApiError,
  commitBindImport,
  previewBindImport,
  previewBindImportFile,
  type BindImportDuplicateMode,
  type BindImportPreview,
  type BindImportResult,
} from "@/lib/api";

type ImportRecordsPanelProps = {
  zoneId: string;
  onClose: () => void;
  onImported: () => void | Promise<void>;
};

type Step = "upload" | "preview" | "result";

const ACCEPTED = ".zone,.bind,.txt,text/plain";
const MAX_BYTES = 1_048_576;

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "invalid":
      return "Invalid";
    case "unsupported":
      return "Unsupported";
    case "duplicate":
      return "Duplicate";
    default:
      return status;
  }
}

export function ImportRecordsPanel({
  zoneId,
  onClose,
  onImported,
}: ImportRecordsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<BindImportPreview | null>(null);
  const [duplicateMode, setDuplicateMode] =
    useState<BindImportDuplicateMode>("skip");
  const [result, setResult] = useState<BindImportResult | null>(null);

  const resetFile = () => {
    setFile(null);
    setContent(null);
    setPreview(null);
    setResult(null);
    setError("");
    setStep("upload");
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFile = useCallback(async (next: File) => {
    setError("");
    const lower = next.name.toLowerCase();
    const okExt =
      lower.endsWith(".zone") || lower.endsWith(".bind") || lower.endsWith(".txt");
    if (!okExt) {
      setError("Unsupported file type. Use .zone, .bind, or .txt");
      return;
    }
    if (next.size === 0) {
      setError("Empty file");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("File exceeds maximum size of 1 MB");
      return;
    }
    const text = await next.text();
    if (text.includes("\u0000")) {
      setError("Binary content is not allowed");
      return;
    }
    setFile(next);
    setContent(text);
  }, []);

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) await acceptFile(dropped);
  };

  const onContinue = async () => {
    if (!file || !content) {
      setError("Choose a zone file to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await previewBindImportFile(zoneId, file);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      // Fallback to JSON preview if multipart fails
      try {
        const data = await previewBindImport(zoneId, {
          content,
          filename: file.name,
        });
        setPreview(data);
        setStep("preview");
      } catch (inner) {
        setError(
          inner instanceof ApiError
            ? inner.message
            : err instanceof ApiError
              ? err.message
              : "Failed to parse zone file",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    if (!content || !file) return;
    setBusy(true);
    setError("");
    try {
      const data = await commitBindImport(zoneId, {
        content,
        filename: file.name,
        duplicate_mode: duplicateMode,
      });
      setResult(data);
      setStep("result");
      await onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hz-modal-backdrop" role="presentation">
      <div
        className="hz-import-wizard"
        role="dialog"
        aria-modal="true"
        aria-label="Import records"
      >
        <div className="hz-import-wizard__header">
          <h3>Import records</h3>
          <button type="button" aria-label="Close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {step === "upload" ? (
          <>
            <p className="hz-import-wizard__desc">
              Import DNS records from a BIND zone file.
            </p>

            <div
              className={`hz-import-dropzone${dragging ? " is-dragging" : ""}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragging(false);
              }}
              onDrop={(e) => void onDrop(e)}
            >
              <FiUpload size={28} aria-hidden="true" />
              <p>Drag and drop a .zone, .bind, or .txt file here</p>
              <ConsoleButton
                variant="normal"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </ConsoleButton>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) void acceptFile(chosen);
                }}
              />
            </div>

            {file ? (
              <div className="hz-import-filemeta">
                <div>
                  <p className="hz-import-filemeta__name">{file.name}</p>
                  <p className="hz-import-filemeta__size">{formatBytes(file.size)}</p>
                </div>
                <button type="button" className="console-link" onClick={resetFile}>
                  Remove
                </button>
              </div>
            ) : null}

            {error ? (
              <p className="console-inline-msg console-inline-msg--error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="hz-import-wizard__actions">
              <ConsoleButton variant="link" onClick={onClose}>
                Cancel
              </ConsoleButton>
              <ConsoleButton
                variant="orange"
                disabled={!file || busy}
                onClick={() => void onContinue()}
              >
                {busy ? "Parsing…" : "Continue"}
              </ConsoleButton>
            </div>
          </>
        ) : null}

        {step === "preview" && preview ? (
          <>
            <p className="hz-import-wizard__desc">
              Review parsed records before importing
              {preview.filename ? ` from ${preview.filename}` : ""}.
            </p>

            <div className="hz-import-summary">
              <span>Valid: {preview.summary.valid}</span>
              <span>Invalid: {preview.summary.invalid}</span>
              <span>Unsupported: {preview.summary.unsupported}</span>
              <span>Duplicate: {preview.summary.duplicate}</span>
            </div>

            {preview.summary.duplicate > 0 ? (
              <fieldset className="hz-import-dup">
                <legend>Duplicate handling</legend>
                <label>
                  <input
                    type="radio"
                    name="dup"
                    checked={duplicateMode === "skip"}
                    onChange={() => setDuplicateMode("skip")}
                  />
                  Skip duplicates (default)
                </label>
                <label>
                  <input
                    type="radio"
                    name="dup"
                    checked={duplicateMode === "replace"}
                    onChange={() => setDuplicateMode("replace")}
                  />
                  Replace duplicates
                </label>
              </fieldset>
            ) : null}

            <div className="hz-import-preview-wrap">
              <table className="hz-import-preview-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>TTL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.records.map((row) => (
                    <tr key={row.index} data-status={row.status}>
                      <td>{row.name}</td>
                      <td>{row.type}</td>
                      <td className="hz-import-preview-table__value">
                        {row.value}
                        {row.reason ? (
                          <span className="hz-import-preview-table__reason">
                            {row.reason}
                          </span>
                        ) : null}
                      </td>
                      <td>{row.ttl}</td>
                      <td>
                        <span className={`hz-import-status hz-import-status--${row.status}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error ? (
              <p className="console-inline-msg console-inline-msg--error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="hz-import-wizard__actions">
              <ConsoleButton variant="link" onClick={onClose}>
                Cancel import
              </ConsoleButton>
              <ConsoleButton variant="normal" onClick={() => setStep("upload")}>
                Back
              </ConsoleButton>
              <ConsoleButton
                variant="orange"
                disabled={busy || preview.summary.valid + preview.summary.duplicate === 0}
                onClick={() => void onImport()}
              >
                {busy ? "Importing…" : "Import"}
              </ConsoleButton>
            </div>
          </>
        ) : null}

        {step === "result" && result ? (
          <>
            <div className="hz-import-result">
              <p className="hz-import-result__title">Import complete</p>
              <ul>
                <li>Imported: {result.imported}</li>
                <li>Skipped: {result.skipped}</li>
                <li>Failed: {result.failed}</li>
              </ul>
            </div>

            {result.failures.length > 0 ? (
              <div className="hz-import-preview-wrap">
                <table className="hz-import-preview-table">
                  <thead>
                    <tr>
                      <th>Record</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failures.map((failure, index) => (
                      <tr key={`${failure.name}-${index}`}>
                        <td>
                          {failure.name} {failure.type} {failure.value}
                        </td>
                        <td>{failure.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="hz-import-wizard__actions">
              <ConsoleButton variant="orange" onClick={onClose}>
                Close
              </ConsoleButton>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
