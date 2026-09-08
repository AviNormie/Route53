import type { Metadata } from "next";
import Link from "next/link";
import { AwsFooter } from "@/components/layout/aws-footer";
import { AwsNavbar } from "@/components/layout/aws-navbar";
import { AwsTopBar } from "@/components/layout/aws-top-bar";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta(
  "API documentation",
  "Interactive Route 53 Clone API reference — Scalar, OpenAPI, and Swagger",
);

export default function DocsPage() {
  return (
    <>
      <div className="sticky top-0 z-50 overflow-visible">
        <AwsTopBar />
        <AwsNavbar />
      </div>

      <main className="api-docs">
        <div className="hero-gradient">
          <div className="page-shell py-10 md:py-12">
            <p className="m-0 text-sm font-medium text-aws-body">Developers</p>
            <h1 className="section-heading mt-2 mb-3">API documentation</h1>
            <p className="m-0 max-w-2xl text-base leading-relaxed text-aws-body md:text-lg">
              Explore the Route 53 Clone REST API: session auth, hosted zones, DNS
              records, and BIND import/export. Interactive docs are powered by{" "}
              <a
                href="https://scalar.com/"
                className="text-aws-link underline underline-offset-2 hover:text-aws-link-hover"
                target="_blank"
                rel="noreferrer"
              >
                Scalar
              </a>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/scalar" className="btn-pill btn-pill-primary" target="_blank" rel="noreferrer">
                Open Scalar
              </a>
              <a href="/swagger" className="btn-pill btn-pill-secondary" target="_blank" rel="noreferrer">
                Swagger UI
              </a>
              <a href="/redoc" className="btn-pill btn-pill-secondary" target="_blank" rel="noreferrer">
                ReDoc
              </a>
              <a href="/openapi.json" className="btn-pill btn-pill-secondary" target="_blank" rel="noreferrer">
                OpenAPI JSON
              </a>
              <Link href="/login" className="btn-pill btn-pill-secondary">
                Sign in to console
              </Link>
            </div>
            <p className="mt-4 m-0 text-sm text-aws-body">
              Demo login: <code className="api-docs__code">demo@example.com</code> /{" "}
              <code className="api-docs__code">DemoPass123!</code>
              {" · "}
              If the panel below is empty, the API may be cold-starting — refresh in ~30s.
            </p>
          </div>
        </div>

        <div className="api-docs__frame-wrap">
          <iframe
            title="Route 53 Clone API — Scalar reference"
            src="/scalar"
            className="api-docs__frame"
          />
        </div>
      </main>

      <AwsFooter />
    </>
  );
}
