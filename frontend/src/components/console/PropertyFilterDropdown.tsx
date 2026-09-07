"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi";

type Option = { value: string; label: string };

type PropertyFilterDropdownProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  widthClass?: string;
};

export function PropertyFilterDropdown({
  label,
  value,
  onChange,
  options,
  widthClass = "w-[200px]",
}: PropertyFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={rootRef} className={`hz-property-filter ${widthClass}`}>
      <button
        type="button"
        className="hz-property-filter__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hz-property-filter__label">{label}</span>
        <span className="hz-property-filter__value">
          {value === "all" ? "All" : selected?.label ?? value}
        </span>
        <HiChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <ul id={listId} className="hz-property-filter__menu" role="listbox">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === "all"}
              className={value === "all" ? "is-selected" : undefined}
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
            >
              All
            </button>
          </li>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={value === option.value ? "is-selected" : undefined}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
