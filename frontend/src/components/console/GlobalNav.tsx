"use client";

import Link from "next/link";
import {
  FiBell,
  FiGrid,
  FiHelpCircle,
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

export function GlobalNav({ session }: GlobalNavProps) {
  return (
    <header className="console-global-nav">
      <div className="console-global-nav__left">
        <Link href="/" className="console-global-nav__aws" aria-label="AWS home">
          <FaAws aria-hidden="true" />
        </Link>
        <span className="console-global-nav__divider" aria-hidden="true" />
        <button type="button" className="console-global-nav__icon-btn" aria-label="Services">
          <span className="console-global-nav__service-mark" aria-hidden="true">
            R
          </span>
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="App launcher">
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
        <button type="button" className="console-global-nav__icon-btn" aria-label="CloudShell">
          <FiTerminal size={16} aria-hidden="true" />
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
        <button type="button" className="console-global-nav__region" aria-label="Region">
          <span>Global</span>
          <HiChevronDown size={14} aria-hidden="true" />
        </button>
        <button type="button" className="console-global-nav__account" aria-label="Account menu">
          <span className="console-global-nav__workgroup">
            {session?.workgroup ?? "Workp... (497535504622)"}
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
