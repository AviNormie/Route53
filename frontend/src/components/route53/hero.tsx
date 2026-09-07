"use client";

import { useState } from "react";
import { ChevronRightIcon, StarIcon } from "@/components/ui/icons";

const breadcrumbs = [
  { label: "Products", href: "#" },
  { label: "Networking and Content Delivery", href: "#" },
  { label: "Amazon Route 53", href: undefined },
] as const;

export function Hero() {
  const [favorited, setFavorited] = useState(false);

  return (
    <section id="overview" className="relative overflow-hidden">
      <div className="page-shell">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm">
          <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
            {breadcrumbs.map((item, index) => (
              <li key={item.label} className="inline-flex items-center gap-2">
                {index > 0 ? (
                  <ChevronRightIcon className="text-aws-body" />
                ) : null}
                {item.href ? (
                  <a href={item.href} className="underline underline-offset-2 hover:text-aws-link">
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-[44rem]">
          <h1 className="section-heading m-0">
            Amazon Route 53 - DNS service
          </h1>
          <p className="mt-4 max-w-[36rem] text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed">
            A reliable and cost-effective way to route end users to Internet applications
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#get-started" className="btn-pill btn-pill-primary min-w-[14rem]">
              Get started with Route 53
            </a>
            <a href="#contact" className="btn-pill btn-pill-secondary min-w-[14rem]">
              Connect with an expert
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="favorite-fab"
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        onClick={() => setFavorited((value) => !value)}
      >
        <StarIcon />
      </button>
    </section>
  );
}
