"use client";

import Link from "next/link";
import {
  FiBell,
  FiGrid,
  FiHelpCircle,
  FiMessageSquare,
  FiSearch,
  FiSettings,
  FiTerminal,
} from "react-icons/fi";
import { FaAws } from "react-icons/fa";
import { HiChevronDown } from "react-icons/hi";
import type { MockSession } from "@/lib/mock/session";

type GlobalNavProps = {
  session: MockSession | null;
};

function CloudShellMark() {
  return (
    <span className="console-global-nav__cloudshell" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="18" height="18">
        <defs>
          <linearGradient id="csGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="18" height="18" rx="4" fill="url(#csGrad)" />
        <path
          d="M6 10.2 8.4 7.8M6 10.2l2.4 2.4M10.2 13h3.6"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

export function GlobalNav({ session }: GlobalNavProps) {
  return (
    <header className="console-global-nav">
      <div className="console-global-nav__left">
        <Link href="/" className="console-global-nav__aws" aria-label="AWS home">
          <FaAws aria-hidden="true" />
        </Link>
        <button type="button" className="console-global-nav__icon-btn" aria-label="CloudShell">
          <CloudShellMark />
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Services">
          <FiGrid size={16} aria-hidden="true" />
        </button>
        <label className="console-global-nav__search">
          <FiSearch size={14} aria-hidden="true" />
          <span className="console-global-nav__search-label">Search</span>
          <input type="search" placeholder="" aria-label="Search" />
          <kbd className="console-global-nav__shortcut">[Option+S]</kbd>
        </label>
      </div>

      <div className="console-global-nav__right">
        <button type="button" className="console-global-nav__icon-btn" aria-label="Feedback">
          <FiMessageSquare size={16} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Notifications">
          <FiBell size={16} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Help">
          <FiHelpCircle size={16} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Settings">
          <FiSettings size={16} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__icon-btn console-global-nav__icon-btn--desktop" aria-label="CloudShell terminal">
          <FiTerminal size={16} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__region" aria-label="Region">
          <span>Global</span>
          <HiChevronDown size={14} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__account" aria-label="Account menu">
          <span className="console-global-nav__workgroup">
            {session?.workgroup ?? "Workpunkt (497535504622)"}
          </span>
          <span className="console-global-nav__username">
            {session?.name ?? "avi"}
            <HiChevronDown size={12} aria-hidden="true" />
          </span>
        </button>
      </div>
    </header>
  );
}
