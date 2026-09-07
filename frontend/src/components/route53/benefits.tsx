import { Accordion } from "@/components/ui/accordion";

const benefits = [
  {
    id: "reliable-dns",
    title:
      "Route end users to your site reliably with globally-dispersed Domain Name System (DNS) servers and automatic scaling.",
    content:
      "Amazon Route 53 uses a global network of DNS servers to answer queries with low latency. As query volume grows, the service scales automatically so your applications remain reachable.",
  },
  {
    id: "fast-setup",
    title:
      "Set up your DNS routing in minutes with domain name registration and straightforward visual traffic flow tools.",
    content:
      "Register domains, create hosted zones, and design routing policies with Traffic Flow. You can get production-ready DNS configuration running quickly without complex networking work.",
  },
  {
    id: "custom-policies",
    title:
      "Customize your DNS routing policies to reduce latency, improve application availability, and maintain compliance.",
    content:
      "Choose latency-based, geolocation, failover, weighted, and other routing policies. Combine them with health checks to keep traffic on healthy endpoints and meet regional requirements.",
  },
] as const;

export function Benefits() {
  return (
    <section
      id="features"
      className="page-shell py-[var(--section-space)]"
      aria-labelledby="benefits-heading"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
        <h2 id="benefits-heading" className="section-heading">
          Benefits of Route 53
        </h2>
        <Accordion items={[...benefits]} />
      </div>
    </section>
  );
}
