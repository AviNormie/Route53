"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  FiBell,
  FiCopy,
  FiHelpCircle,
  FiSearch,
  FiSettings,
} from "react-icons/fi";
import { FaAws } from "react-icons/fa";
import { TriangleDownIcon, TriangleUpIcon } from "@/components/console/TriangleDownIcon";
import { logout } from "@/lib/api";
import type { MockSession } from "@/lib/mock/session";

type GlobalNavProps = {
  session: MockSession | null;
};

const ACCOUNT_ID = "497535504622";
const ACCOUNT_ID_DISPLAY = "4975-3550-4622";
const ACCOUNT_NAME = "Workpunkt";

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
      <circle cx="3" cy="3" r="1.35" />
      <circle cx="8" cy="3" r="1.35" />
      <circle cx="13" cy="3" r="1.35" />
      <circle cx="3" cy="8" r="1.35" />
      <circle cx="8" cy="8" r="1.35" />
      <circle cx="13" cy="8" r="1.35" />
      <circle cx="3" cy="13" r="1.35" />
      <circle cx="8" cy="13" r="1.35" />
      <circle cx="13" cy="13" r="1.35" />
    </svg>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="console-account-menu__copy"
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore */
        }
      }}
    >
      <FiCopy size={12} aria-hidden="true" />
    </button>
  );
}

function AccountMenu({
  open,
  username,
  onClose,
  onSignOut,
}: {
  open: boolean;
  username: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  if (!open) return null;

  const links = [
    "Account",
    "Organisation",
    "Service Quotas",
    "Billing and Cost Management",
    "Security credentials",
    "Console mobile app",
    "Agent Toolkit for AWS",
  ] as const;

  return (
    <div className="console-account-menu" role="dialog" aria-label="Account menu">
      <dl className="console-account-menu__meta">
        <div>
          <dt>Account ID</dt>
          <dd>
            <span className="console-account-menu__value">{ACCOUNT_ID_DISPLAY}</span>
            <CopyButton value={ACCOUNT_ID} label="Account ID" />
          </dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>
            <span className="console-account-menu__value">{ACCOUNT_NAME}</span>
            <CopyButton value={ACCOUNT_NAME} label="Account name" />
          </dd>
        </div>
        <div>
          <dt>Account colour</dt>
          <dd>
            <span className="console-account-menu__swatch" aria-hidden="true" />
            <span className="console-account-menu__muted">Unset</span>
          </dd>
        </div>
        <div>
          <dt>IAM user</dt>
          <dd>
            <span className="console-account-menu__value">{username}</span>
            <CopyButton value={username} label="IAM user" />
          </dd>
        </div>
      </dl>

      <nav className="console-account-menu__links" aria-label="Account links">
        {links.map((label) => (
          <a
            key={label}
            href="#"
            className={
              label === "Console mobile app"
                ? "console-account-menu__link is-disabled"
                : "console-account-menu__link"
            }
            onClick={(e) => {
              e.preventDefault();
              if (label !== "Console mobile app") onClose();
            }}
            aria-disabled={label === "Console mobile app"}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="console-account-menu__actions">
        <button type="button" className="console-btn console-btn--normal console-account-menu__multi">
          Turn on multi-session support
        </button>
        <div className="console-account-menu__row">
          <button type="button" className="console-btn console-btn--normal">
            Switch role
          </button>
          <button type="button" className="console-btn console-btn--primary" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlobalNav({ session }: GlobalNavProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const username = session?.name ?? "avi";
  const workgroupLabel = session?.workgroup ?? `${ACCOUNT_NAME} (${ACCOUNT_ID})`;

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const onSignOut = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="console-top">
      <div className="console-utility-bar">
        <div className="console-utility-bar__spacer" />
      </div>

      <header className="console-global-nav">
        <div className="console-global-nav__left">
          <Link href="/" className="console-global-nav__aws" aria-label="AWS home">
            <FaAws aria-hidden="true" className="h-8 w-8"/>
          </Link>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__icon-btn" aria-label="Amazon Q">
            <AmazonQIcon />
          </button>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__icon-btn" aria-label="Services">
            <ServicesGridIcon />
          </button>
          <label className="console-global-nav__search">
            <FiSearch size={14} aria-hidden="true" />
            <span className="console-global-nav__search-label">Search</span>
            <input type="search" placeholder="" aria-label="Search" />
            <kbd className="console-global-nav__shortcut">[Option+S]</kbd>
            <span className="console-global-nav__search-hex" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.5 1.3 13.8 4.4v6.2L8.5 13.7 3.2 10.6V4.4L8.5 1.3Z" />
              </svg>
            </span>
          </label>
        </div>

        <div className="console-global-nav__right">
          <button
            type="button"
            className="console-global-nav__icon-btn console-global-nav__cloudshell-btn"
            aria-label="CloudShell"
          >
            <span className="console-global-nav__cloudshell-glyph" aria-hidden="true">
              &gt;_
            </span>
          </button>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__icon-btn" aria-label="Notifications">
            <FiBell size={16} aria-hidden="true" />
          </button>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__icon-btn" aria-label="Help">
            <FiHelpCircle size={16} aria-hidden="true" />
          </button>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__icon-btn" aria-label="Settings">
            <FiSettings size={16} aria-hidden="true" />
          </button>
          <span className="console-global-nav__vsep" aria-hidden="true" />
          <button type="button" className="console-global-nav__region" aria-label="Region">
            <span>Global</span>
            <TriangleDownIcon size={10} />
          </button>
        </div>

        <div className="console-account" ref={accountRef}>
          <button
            type="button"
            className={`console-account__trigger${menuOpen ? " is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span>{workgroupLabel}</span>
            {menuOpen ? <TriangleUpIcon size={10} /> : <TriangleDownIcon size={10} />}
          </button>
          <span className="console-global-nav__iam-user">{username}</span>
          <AccountMenu
            open={menuOpen}
            username={username}
            onClose={() => setMenuOpen(false)}
            onSignOut={() => void onSignOut()}
          />
        </div>
      </header>
    </div>
  );
}
