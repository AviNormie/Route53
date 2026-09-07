import type { Metadata } from "next";
import { AwsFooter } from "@/components/layout/aws-footer";
import { AwsNavbar } from "@/components/layout/aws-navbar";
import { AwsTopBar } from "@/components/layout/aws-top-bar";
import { Route53Navbar } from "@/components/layout/route53-navbar";
import { Benefits } from "@/components/route53/benefits";
import { Customers } from "@/components/route53/customers";
import { Feedback } from "@/components/route53/feedback";
import { Hero } from "@/components/route53/hero";
import { HowItWorks } from "@/components/route53/how-it-works";
import { ResourceCards } from "@/components/route53/resource-cards";
import { UseCases } from "@/components/route53/use-cases";

export const metadata: Metadata = {
  title: "Amazon Route 53 - DNS service",
  description:
    "A reliable and cost-effective way to route end users to Internet applications",
};

export default function HomePage() {
  return (
    <>
      <div className="sticky top-0 z-50 overflow-visible">
        <AwsTopBar />
        <AwsNavbar />
      </div>

      <main>
        <Route53Navbar />
        <div className="hero-gradient">
          <Hero />
        </div>
        <Benefits />
        <HowItWorks />
        <UseCases />
        <Customers />
        <ResourceCards />
        <Feedback />
      </main>

      <AwsFooter />
    </>
  );
}
