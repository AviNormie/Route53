import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";

const cards = [
  {
    id: "features",
    label: "Features page",
    title: "Explore Amazon Route 53 features",
    href: "#features",
    image: "/images/route53/resource-features.svg",
    imageAlt: "Abstract blue network mesh representing Route 53 features",
    glow: "resource-glow-blue",
    span: "lg:row-span-2",
    showTitle: false,
  },
  {
    id: "getting-started",
    label: "Getting started",
    title: "Secure your Amazon VPC DNS resolution with Amazon Route 53 Resolver DNS Firewall",
    href: "#get-started",
    image: "/images/route53/resource-getting-started.svg",
    imageAlt: "Dark geometric pattern for getting started resources",
    glow: "resource-glow-dark",
    span: "",
    showTitle: true,
  },
  {
    id: "contact",
    label: "Contact us",
    title: "Talk with an AWS expert about Route 53",
    href: "#contact",
    image: "/images/route53/resource-contact.svg",
    imageAlt: "Red abstract mesh representing contact resources",
    glow: "resource-glow-red",
    span: "",
    showTitle: false,
  },
] as const;

export function ResourceCards() {
  return (
    <section
      id="get-started"
      className="page-shell scroll-mt-28 py-[var(--section-space)]"
      aria-labelledby="get-started-heading"
    >
      <div id="pricing" className="sr-only">
        Pricing
      </div>
      <div id="resources" className="sr-only">
        Resources
      </div>
      <div id="faqs" className="sr-only">
        FAQs
      </div>
      <h2 id="get-started-heading" className="section-heading mb-8">
        Get started
      </h2>

      <div className="grid gap-5 lg:grid-cols-2 lg:grid-rows-2 lg:gap-6">
        {cards.map((card) => (
          <a
            key={card.id}
            id={card.id === "contact" ? "contact" : undefined}
            href={card.href}
            className={`group relative min-h-[14rem] overflow-hidden rounded-[1.25rem] ${card.glow} ${card.span} ${
              card.id === "features" ? "min-h-[22rem] lg:min-h-full" : ""
            }`}
          >
            <Image
              src={card.image}
              alt={card.imageAlt}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
              <span className="inline-flex w-fit rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {card.label}
              </span>

              {card.showTitle ? (
                <div className="max-w-[28rem]">
                  <h3 className="m-0 text-[clamp(1.15rem,1.8vw,1.6rem)] font-bold leading-snug text-white">
                    {card.title}
                  </h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Learn more
                    <ArrowRightIcon />
                  </span>
                </div>
              ) : (
                <span className="sr-only">{card.title}</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
