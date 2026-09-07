"use client";

import Link from "next/link";
import { useState } from "react";
import { FaAws } from "react-icons/fa";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";

const leftLinks = [
  "Discover AWS",
  "Products",
  "Solutions",
  "Pricing",
  "Resources",
] as const;

export function AwsNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-aws-border bg-white">
      <div className="page-shell flex min-h-[64px] items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3 lg:gap-5">
          <Link
            href="/"
            className="shrink-0 text-[2.25rem] leading-none text-aws-ink"
            aria-label="Amazon Web Services home"
          >
            <FaAws aria-hidden="true" />
          </Link>

          <a href="#" className="hidden text-sm font-medium text-aws-ink hover:underline xl:inline">
            re:Invent
          </a>

          <span className="hidden h-5 w-px bg-aws-border xl:block" aria-hidden="true" />

          <nav className="hidden items-center gap-4 xl:flex" aria-label="AWS primary">
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

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-aws-ink hover:underline"
            aria-label="Search"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
          </button>

          <Link
            href="/login"
            className="hidden text-sm font-medium text-aws-ink hover:underline md:inline"
          >
            Sign in to console
          </Link>

          <a
            href="#"
            className="btn-pill btn-pill-primary hidden h-12 w-[175px] px-0 text-sm sm:inline-flex"
          >
            Create account
          </a>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border border-aws-border xl:hidden"
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
          <nav className="page-shell flex flex-col gap-1 py-3" aria-label="AWS mobile">
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
            <Link href="/login" className="rounded-md px-2 py-2 text-sm font-medium hover:bg-aws-muted-bg">
              Sign in to console
            </Link>
            <a href="#" className="btn-pill btn-pill-primary mt-2 w-full sm:hidden">
              Create account
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
