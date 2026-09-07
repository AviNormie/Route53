"use client";

import Link from "next/link";
import { useId } from "react";
import {
  FiBell,
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

function AmazonQIcon() {
  const uid = useId().replace(/:/g, "");
  const gradientId = `q-icon-radial-gradient-${uid}`;
  const clipId = `q-icon-clip-path-${uid}`;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="console-global-nav__q-icon"
    >
      <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
      <g clipPath={`url(#${clipId})`}>
        <path
          fill="#fff"
          d="M18.2199 7.40941L12.8699 4.31846C12.6299 4.17842 12.3199 4.1084 11.9999 4.1084C11.6799 4.1084 11.3699 4.17842 11.1299 4.31846L5.77991 7.40941C5.29991 7.67949 4.90991 8.3597 4.90991 8.90986V15.0917C4.90991 15.6419 5.29991 16.3121 5.77991 16.5922L11.1399 19.6832C11.3799 19.8232 11.6899 19.8932 12.0099 19.8932C12.3299 19.8932 12.6399 19.8232 12.8799 19.6832L18.2399 16.5922C18.7199 16.3121 19.1099 15.6419 19.1099 15.0917V8.90986C19.1099 8.3597 18.7199 7.67949 18.2399 7.40941H18.2199ZM11.9999 17.8826L6.90991 14.9417V9.05991L11.9999 6.11901L17.0899 9.05991V13.7813L13.9999 12.0008V11.2606C13.9999 11.0005 13.8599 10.7704 13.6399 10.6404L12.3599 9.90017C12.2499 9.84015 12.1199 9.80013 11.9999 9.80013C11.8799 9.80013 11.7499 9.83014 11.6399 9.90017L10.3599 10.6404C10.1399 10.7704 9.99991 11.0105 9.99991 11.2606V12.741C9.99991 13.0011 10.1399 13.2312 10.3599 13.3612L11.6399 14.1014C11.7499 14.1615 11.8799 14.2015 11.9999 14.2015C12.1199 14.2015 12.2499 14.1715 12.3599 14.1014L12.9999 13.7313L16.0899 15.5119L11.9999 17.8726V17.8826Z"
        />
      </g>
      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(26.1421 -2.14213) rotate(135) scale(40 51.1797)"
        >
          <stop stopColor="#FF6AD5" />
          <stop offset="0.3" stopColor="#D946EF" />
          <stop offset="0.45" stopColor="#C026D3" />
          <stop offset="0.6" stopColor="#A855F7" />
          <stop offset="0.8" stopColor="#7C3AED" />
        </radialGradient>
        <clipPath id={clipId}>
          <rect width="16" height="16.0049" fill="white" transform="translate(4 3.99805)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ServicesGridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

export function GlobalNav({ session }: GlobalNavProps) {
  return (
    <header className="console-global-nav">
      <div className="console-global-nav__left">
        <Link href="/" className="console-global-nav__aws" aria-label="AWS home">
          <FaAws aria-hidden="true" />
        </Link>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Amazon Q">
          <AmazonQIcon />
        </button>
        <button type="button" className="console-global-nav__icon-btn" aria-label="Services">
          <ServicesGridIcon />
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
