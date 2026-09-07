"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

const featureLinks = [
  "DNS management",
  "Traffic policies",
  "Health checks",
  "Resolver",
  "Profiles",
] as const;

const navLinks = [
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources" },
  { label: "FAQs", href: "#faqs" },
] as const;

export function Route53Navbar() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" },
    );

    const sentinel = shell.previousElementSibling;
    if (sentinel instanceof HTMLElement) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!featuresOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFeaturesOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [featuresOpen]);

  return (
    <>
      <div aria-hidden="true" className="h-px w-full" />
      <div ref={shellRef} className={`product-nav-shell ${stuck ? "is-stuck" : ""}`}>
        <div className="page-shell">
          <nav className="product-nav" aria-label="Amazon Route 53" ref={menuRef}>
            <Link
              href="/"
              className="shrink-0 text-[clamp(0.95rem,1.1vw,1.05rem)] font-bold text-aws-ink"
            >
              Amazon Route 53
            </Link>

            <div className="hidden items-stretch gap-1 md:flex lg:gap-2">
              <a
                href="#overview"
                className="relative inline-flex items-center px-3 py-3 text-sm font-semibold text-aws-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-aws-ink"
                aria-current="page"
              >
                Overview
              </a>

              <div className="relative">
                <button
                  type="button"
                  className="inline-flex h-full items-center gap-1.5 px-3 py-3 text-sm font-medium text-aws-ink hover:bg-aws-muted-bg"
                  aria-expanded={featuresOpen}
                  aria-haspopup="menu"
                  onClick={() => setFeaturesOpen((value) => !value)}
                >
                  Features
                  <ChevronDownIcon />
                </button>

                {featuresOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-lg border border-aws-border bg-white py-2 shadow-lg"
                  >
                    {featureLinks.map((label) => (
                      <a
                        key={label}
                        role="menuitem"
                        href="#features"
                        className="block px-4 py-2 text-sm text-aws-ink hover:bg-aws-muted-bg"
                        onClick={() => setFeaturesOpen(false)}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex items-center px-3 py-3 text-sm font-medium text-aws-ink hover:bg-aws-muted-bg"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <a href="#overview" className="text-sm font-semibold text-aws-ink">
                Overview
              </a>
              <button
                type="button"
                className="rounded-md border border-aws-border px-2 py-1 text-sm"
                aria-expanded={featuresOpen}
                onClick={() => setFeaturesOpen((value) => !value)}
              >
                More
              </button>
            </div>
          </nav>

          {featuresOpen ? (
            <div className="mt-2 rounded-lg border border-aws-border bg-white p-2 shadow-md md:hidden">
              {[...featureLinks, "Pricing", "Resources", "FAQs"].map((label) => (
                <a
                  key={label}
                  href={
                    label === "Pricing" || label === "Resources" || label === "FAQs"
                      ? `#${label.toLowerCase()}`
                      : "#features"
                  }
                  className="block rounded-md px-3 py-2 text-sm hover:bg-aws-muted-bg"
                  onClick={() => setFeaturesOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
