import type { NextConfig } from "next";

const apiOrigin = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    // Proxy FastAPI docs UIs + OpenAPI schema onto the Vercel origin so
    // https://route53-ten.vercel.app/docs can embed them same-origin.
    return [
      { source: "/scalar", destination: `${apiOrigin}/scalar` },
      { source: "/redoc", destination: `${apiOrigin}/redoc` },
      { source: "/openapi.json", destination: `${apiOrigin}/openapi.json` },
      { source: "/swagger", destination: `${apiOrigin}/docs` },
      { source: "/docs/oauth2-redirect", destination: `${apiOrigin}/docs/oauth2-redirect` },
    ];
  },
};

export default nextConfig;
