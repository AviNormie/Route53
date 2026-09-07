import { Accordion } from "@/components/ui/accordion";

const useCases = [
  {
    id: "global-traffic",
    title: "Manage network traffic globally",
    content:
      "Use latency-based, geolocation, and geoproximity routing to direct users to the best endpoint worldwide while keeping control of how traffic flows across regions.",
  },
  {
    id: "high-availability",
    title: "Build highly available applications",
    content:
      "Combine health checks with failover routing so Route 53 can automatically shift traffic away from unhealthy endpoints and keep applications available.",
  },
  {
    id: "private-dns",
    title: "Set up private DNS",
    content:
      "Create private hosted zones for Amazon VPC resources, resolve internal names securely, and keep private DNS traffic off the public internet.",
  },
] as const;

export function UseCases() {
  return (
    <section className="page-shell py-[var(--section-space)]" aria-labelledby="use-cases-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
        <h2 id="use-cases-heading" className="section-heading">
          Use cases
        </h2>
        <Accordion items={[...useCases]} />
      </div>
    </section>
  );
}
