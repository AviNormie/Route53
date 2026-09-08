import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiOrigin(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

function buildUpstreamUrl(req: NextRequest, path: string[]): string {
  const suffix = path.map(encodeURIComponent).join("/");
  const search = req.nextUrl.search;
  return `${apiOrigin()}/api/v1/${suffix}${search}`;
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const upstreamUrl = buildUpstreamUrl(req, path);
  const headers = new Headers();

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
    init.duplex = "half";
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers();

  const passThrough = [
    "content-type",
    "content-disposition",
    "cache-control",
    "x-request-id",
  ];
  for (const name of passThrough) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  for (const value of setCookies) {
    // Drop Domain so the browser stores the cookie on this frontend origin.
    const rewritten = value.replace(/;\s*Domain=[^;]+/i, "");
    response.headers.append("set-cookie", rewritten);
  }

  return response;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  try {
    return await proxy(req, path ?? []);
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach the API." },
      { status: 502 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
