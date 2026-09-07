export function HowItWorks() {
  return (
    <section className="page-shell py-[var(--section-space)]" aria-labelledby="how-it-works-heading">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-16">
        <h2 id="how-it-works-heading" className="section-heading">
          How it works
        </h2>

        <div className="space-y-5 text-[clamp(1rem,1.1vw,1.0625rem)] leading-7 text-aws-ink">
          <p className="m-0">
            Amazon Route 53 provides highly available and scalable{" "}
            <a href="#" className="aws-link">
              Domain Name System (DNS)
            </a>
            ,{" "}
            <a href="#" className="aws-link">
              domain name registration
            </a>
            , and{" "}
            <a href="#" className="aws-link">
              health-checking
            </a>{" "}
            cloud services. It is designed to give developers and businesses an extremely reliable
            and cost-effective way to route end users to internet applications by translating names
            like example.com into the numeric IP addresses, such as 192.0.2.1, that computers use to
            connect to each other. You can combine your Route 53 DNS with health-checking services to
            route traffic to healthy endpoints or to independently monitor and alarm on endpoints.
            You can also use the{" "}
            <a href="#" className="aws-link">
              Traffic Flow
            </a>{" "}
            visual policy builder to simplify the implementation of your routing policies, and you
            can purchase and manage domain names such as example.com and automatically configure DNS
            settings for your domains.
          </p>

          <p className="m-0">
            In addition,{" "}
            <a href="#" className="aws-link">
              Route 53 Resolver
            </a>{" "}
            provides a regional DNS service that performs recursive DNS lookups for names hosted in
            Amazon Elastic Compute Cloud (EC2), as well as public names on the internet. Lastly, the{" "}
            <a href="#" className="aws-link">
              Route 53 Resolver DNS Firewall
            </a>{" "}
            allows you to block queries made for known or suspected malicious domains, and to allow
            queries for trusted domains when using the Route 53 Resolver for recursive DNS
            resolution.
          </p>
        </div>
      </div>
    </section>
  );
}
