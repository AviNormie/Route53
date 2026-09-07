"use client";

import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";

const customers = [
  {
    id: "capital-one",
    title: "Capital One improves cloud resilience with Amazon Route 53",
    href: "#",
    image: "/images/route53/customer-capital-one.svg",
    imageAlt: "Capital One customer story visual for Amazon Route 53",
    brand: "Capital One",
    cta: "Read the story",
  },
  {
    id: "netflix",
    title: "Netflix improved application resiliency with Amazon Route 53",
    href: "#",
    image: "/images/route53/customer-netflix.svg",
    imageAlt: "Netflix customer story visual for Amazon Route 53",
    brand: "Netflix",
    cta: "Watch the video",
  },
] as const;

export function Customers() {
  return (
    <section className="customers-section" aria-labelledby="customers-heading">
      <div className="page-shell">
        <h2 id="customers-heading" className="section-heading mb-8">
          Customers
        </h2>
      </div>

      <div className="customer-stack" style={{ ["--stack-count" as string]: customers.length }}>
        {customers.map((customer, index) => (
          <div
            key={customer.id}
            className="customer-stack__slot"
            style={{ zIndex: index + 1 }}
          >
            <a
              href={customer.href}
              className="customer-stack__card customer-glow group focus-visible:outline-offset-4"
              aria-label={`${customer.brand}: ${customer.title}`}
            >
              <div className="customer-stack__media">
                <Image
                  src={customer.image}
                  alt={customer.imageAlt}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1600px) 100vw, 1600px"
                  priority={index === 0}
                />
                <div className="customer-stack__shade" aria-hidden="true" />
                <div className="customer-stack__content">
                  <p className="customer-stack__brand">{customer.brand}</p>
                  <h3 className="customer-stack__title">{customer.title}</h3>
                  <span className="customer-stack__cta">
                    {customer.cta}
                    <ArrowRightIcon />
                  </span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
