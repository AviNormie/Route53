import type { Metadata } from "next";
import Link from "next/link";
import { AwsFooter } from "@/components/layout/aws-footer";
import { AwsNavbar } from "@/components/layout/aws-navbar";
import { AwsTopBar } from "@/components/layout/aws-top-bar";

export const metadata: Metadata = {
  title: {
    absolute: "Page not found | Route 53 Clone",
  },
  description: "The page you requested does not exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <div className="sticky top-0 z-50 overflow-visible">
        <AwsTopBar />
        <AwsNavbar />
      </div>

      <main>
        <div className="hero-gradient">
          <section className="page-shell flex min-h-[min(70vh,40rem)] flex-col justify-center py-16 md:py-24">
            <p className="m-0 text-sm font-semibold tracking-wide text-aws-body uppercase">
              Error 404
            </p>
            <h1 className="section-heading mt-3 mb-4 max-w-xl">Page not found</h1>
            <p className="m-0 max-w-lg text-base leading-relaxed text-aws-body md:text-lg">
              The page you requested does not exist, or it may have moved. Check the
              URL, or head back to Route 53.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/" className="btn-pill btn-pill-primary min-w-[12rem]">
                Go to homepage
              </Link>
              <Link href="/dashboard" className="btn-pill btn-pill-secondary min-w-[12rem]">
                Open console
              </Link>
              <Link href="/docs" className="btn-pill btn-pill-secondary min-w-[12rem]">
                API docs
              </Link>
            </div>
          </section>
        </div>
      </main>

      <AwsFooter />
    </>
  );
}
