"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaAws } from "react-icons/fa";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/api";

const leftLinks = [
  "Discover AWS",
  "Products",
  "Solutions",
  "Pricing",
  "Resources",
] as const;

export function AwsNavbar() {
  const [open, setOpen] = useState(false);
  const [consoleHref, setConsoleHref] = useState("/login");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await getCurrentUser();
        if (!cancelled) setConsoleHref(user ? "/dashboard" : "/login");
      } catch {
        if (!cancelled) setConsoleHref("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="border-b border-aws-border bg-white">
      <div className="page-shell page-shell--nav flex min-h-[72px] items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <Link
            href="/"
            className="shrink-0 text-[1.85rem] leading-none text-aws-ink"
            aria-label="Amazon Web Services home"
          >
            <FaAws aria-hidden="true" />
          </Link>

          <a href="#" className="hidden text-sm font-medium text-aws-ink hover:underline xl:inline">
            re:Invent
          </a>

          <span className="hidden h-5 w-px bg-aws-border xl:block" aria-hidden="true" />

          <nav className="hidden items-center gap-3 xl:flex" aria-label="AWS primary">
            {leftLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="rounded-sm px-1 py-1 text-sm font-medium text-aws-ink hover:bg-aws-muted-bg"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-aws-ink hover:underline"
            aria-label="Search"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
          </button>

          <Link
            href={consoleHref}
            className="hidden text-sm font-medium text-aws-ink hover:underline md:inline"
          >
            Sign in to console
          </Link>

          <span className="gradient-glow gradient-glow--pill hidden sm:inline-flex">
            <Link
              href="/login?mode=signup"
              className="btn-pill btn-pill-primary btn-pill--nav-cta"
            >
              Create account
            </Link>
          </span>

          <button
            type="button"
            className="grid size-9 place-items-center rounded-md border border-aws-border xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-aws-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-aws-nav" className="border-t border-aws-border bg-white xl:hidden">
          <nav className="page-shell page-shell--nav flex flex-col gap-1 py-3" aria-label="AWS mobile">
            <a href="#" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-aws-muted-bg">
              re:Invent
            </a>
            {leftLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-aws-muted-bg"
              >
                {label}
              </a>
            ))}
            <Link
              href={consoleHref}
              className="rounded-md px-2 py-2 text-sm font-medium hover:bg-aws-muted-bg"
            >
              Sign in to console
            </Link>
            <span className="gradient-glow gradient-glow--pill gradient-glow--block mt-2 sm:hidden">
              <Link
                href="/login?mode=signup"
                className="btn-pill btn-pill-primary btn-pill--nav-cta w-full"
              >
                Create account
              </Link>
            </span>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
