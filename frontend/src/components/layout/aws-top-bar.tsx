"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, GlobeIcon, UserIcon } from "@/components/ui/icons";

const links = [
  { label: "Contact us", href: "#" },
  { label: "AWS Marketplace", href: "#" },
] as const;

export function AwsTopBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  return (
    <div className="relative z-[60] overflow-visible bg-aws-topbar text-white">
      <div className="page-shell page-shell--nav flex h-[58px] items-center justify-end gap-4 overflow-visible text-[13px] sm:gap-5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-sm hover:underline"
          aria-haspopup="listbox"
          aria-label="Select language"
        >
          <GlobeIcon />
          <span>English</span>
          <ChevronDownIcon />
        </button>

        {links.map((link) => (
          <a key={link.label} href={link.href} className="hidden hover:underline sm:inline">
            {link.label}
          </a>
        ))}

        <button
          type="button"
          className="hidden items-center gap-1.5 hover:underline md:inline-flex"
          aria-haspopup="menu"
        >
          Support
          <ChevronDownIcon />
        </button>

        <button
          type="button"
          className="hidden items-center gap-1.5 hover:underline md:inline-flex"
          aria-haspopup="menu"
        >
          My account
          <ChevronDownIcon />
        </button>

        <div ref={rootRef} className="relative overflow-visible">
          <span
            className={`gradient-glow gradient-glow--circle ${profileOpen ? "is-glowing" : ""}`}
          >
            <button
              type="button"
              className="grid size-7 place-items-center rounded-full border-[1.5px] border-white bg-aws-topbar text-white"
              aria-label="AWS Profile"
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
              aria-controls={menuId}
              onClick={() => setProfileOpen((value) => !value)}
            >
              <UserIcon size={16} className="profile-avatar-icon" />
            </button>
          </span>

          <div
            className={`profile-menu-panel ${profileOpen ? "is-open" : ""}`}
            aria-hidden={!profileOpen}
          >
            <div
              className={` gradient-glow--card ${profileOpen ? "is-glowing" : ""}`}
            >
              <div id={menuId} role="dialog" aria-label="AWS Profile" className="profile-menu">
                <h2 className="profile-menu__title">AWS Profile</h2>
                <p className="profile-menu__body">
                  Your profile helps improve your interactions with select AWS experiences.
                </p>
                <span
                  className={`hover:gradient-glow ${profileOpen ? "is-glowing" : ""}`}
                >
                  <Link
                    href="/login?mode=signup"
                    className="btn-pill btn-pill-primary profile-menu__cta"
                    onClick={() => setProfileOpen(false)}
                  >
                    Create profile or sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
