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
    <section className="page-shell py-[var(--section-space)]" aria-labelledby="customers-heading">
      <h2 id="customers-heading" className="section-heading mb-8">
        Customers
      </h2>

      <div className="grid gap-8">
        {customers.map((customer) => (
          <a
            key={customer.id}
            href={customer.href}
            className="customer-glow group relative block overflow-hidden rounded-[1.5rem] focus-visible:outline-offset-4"
          >
            <div className="relative aspect-[16/8] min-h-[16rem] w-full sm:aspect-[21/9]">
              <Image
                src={customer.image}
                alt={customer.imageAlt}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 1600px) 100vw, 1600px"
                priority={customer.id === "capital-one"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
                <p className="mb-3 text-sm font-semibold tracking-wide text-white/80">
                  {customer.brand}
                </p>
                <h3 className="m-0 max-w-[34rem] text-[clamp(1.25rem,2.4vw,2rem)] font-bold leading-snug text-white">
                  {customer.title}
                </h3>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {customer.cta}
                  <ArrowRightIcon />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
