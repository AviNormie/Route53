export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
}

export type AuthUser = {
  id: number;
  email: string;
  created_at: string;
};

export type HostedZoneType = "Public" | "Private";

export type HostedZone = {
  id: string;
  name: string;
  type: HostedZoneType;
  comment: string | null;
  record_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
};

export type HostedZoneList = {
  items: HostedZone[];
  total: number;
  page: number;
  page_size: number;
};

export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA"
  | "SOA";

export type DnsRecord = {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: DnsRecordType;
  ttl: number;
  value: string;
  priority: number | null;
  weight: number | null;
  port: number | null;
  caa_flag: number | null;
  caa_tag: "issue" | "issuewild" | "iodef" | null;
  created_at: string;
  updated_at: string;
};

export type DnsRecordList = {
  items: DnsRecord[];
  total: number;
  page: number;
  page_size: number;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch {
    // ignore JSON parse errors
  }
  return response.statusText || "Request failed";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function displayDomain(name: string): string {
  return name.endsWith(".") ? name.slice(0, -1) : name;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  return response.json() as Promise<AuthUser>;
}

/** Ensure a session cookie exists (demo login for console entry without Builder ID). */
export async function ensureSession(): Promise<AuthUser> {
  const current = await getCurrentUser();
  if (current) return current;

  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL || "demo@example.com";
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "DemoPass123!";
  return login(email, password);
}

export async function listHostedZones(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<HostedZoneList> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return apiFetch<HostedZoneList>(`/api/v1/hosted-zones${query ? `?${query}` : ""}`);
}

export async function getHostedZone(zoneId: string): Promise<HostedZone> {
  return apiFetch<HostedZone>(`/api/v1/hosted-zones/${encodeURIComponent(zoneId)}`);
}

export async function createHostedZone(input: {
  name: string;
  comment?: string;
  type?: HostedZoneType;
}): Promise<HostedZone> {
  return apiFetch<HostedZone>("/api/v1/hosted-zones", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      comment: input.comment || null,
      type: input.type ?? "Public",
    }),
  });
}

export async function deleteHostedZone(zoneId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/hosted-zones/${encodeURIComponent(zoneId)}`, {
    method: "DELETE",
  });
}

export async function listDnsRecords(
  zoneId: string,
  params?: { search?: string; type?: string; page?: number; page_size?: number },
): Promise<DnsRecordList> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.type) qs.set("type", params.type);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return apiFetch<DnsRecordList>(
    `/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/records${query ? `?${query}` : ""}`,
  );
}

export type CreateDnsRecordInput = {
  name: string;
  type: DnsRecordType;
  ttl: number;
  value: string;
  priority?: number;
  weight?: number;
  port?: number;
  caa_flag?: number;
  caa_tag?: "issue" | "issuewild" | "iodef";
};

export async function createDnsRecord(
  zoneId: string,
  input: CreateDnsRecordInput,
): Promise<DnsRecord> {
  const body: Record<string, unknown> = {
    name: input.name,
    type: input.type,
    ttl: input.ttl,
    value: input.value,
  };
  if (input.type === "MX" || input.type === "SRV") {
    body.priority = input.priority ?? 10;
  }
  if (input.type === "SRV") {
    body.weight = input.weight ?? 0;
    body.port = input.port ?? 0;
  }
  if (input.type === "CAA") {
    body.caa_flag = input.caa_flag ?? 0;
    body.caa_tag = input.caa_tag ?? "issue";
  }

  return apiFetch<DnsRecord>(`/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/records`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDnsRecord(
  recordId: string,
  input: CreateDnsRecordInput,
): Promise<DnsRecord> {
  const body: Record<string, unknown> = {
    name: input.name,
    type: input.type,
    ttl: input.ttl,
    value: input.value,
  };
  if (input.type === "MX" || input.type === "SRV") {
    body.priority = input.priority ?? 10;
  }
  if (input.type === "SRV") {
    body.weight = input.weight ?? 0;
    body.port = input.port ?? 0;
  }
  if (input.type === "CAA") {
    body.caa_flag = input.caa_flag ?? 0;
    body.caa_tag = input.caa_tag ?? "issue";
  }

  return apiFetch<DnsRecord>(`/api/v1/records/${encodeURIComponent(recordId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteDnsRecord(recordId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/records/${encodeURIComponent(recordId)}`, {
    method: "DELETE",
  });
}

export type BindImportRecordStatus =
  | "valid"
  | "invalid"
  | "unsupported"
  | "duplicate";

export type BindImportPreviewRecord = {
  index: number;
  name: string;
  type: string;
  value: string;
  ttl: number;
  priority: number | null;
  weight: number | null;
  port: number | null;
  caa_flag: number | null;
  caa_tag: string | null;
  status: BindImportRecordStatus;
  reason: string | null;
  existing_record_id: string | null;
  line: number | null;
};

export type BindImportPreview = {
  origin: string | null;
  filename: string | null;
  records: BindImportPreviewRecord[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    unsupported: number;
    duplicate: number;
  };
  warnings: string[];
};

export type BindImportDuplicateMode = "skip" | "replace";

export type BindImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  failures: Array<{
    name: string;
    type: string;
    value: string;
    reason: string;
  }>;
};

export async function previewBindImport(
  zoneId: string,
  input: { content: string; filename?: string },
): Promise<BindImportPreview> {
  return apiFetch<BindImportPreview>(
    `/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/records/import/preview-json`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.content,
        filename: input.filename ?? null,
      }),
    },
  );
}

export async function previewBindImportFile(
  zoneId: string,
  file: File,
): Promise<BindImportPreview> {
  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch(
    `${getApiUrl()}/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/records/import/preview`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    },
  );
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json() as Promise<BindImportPreview>;
}

export async function commitBindImport(
  zoneId: string,
  input: {
    content: string;
    filename?: string;
    duplicate_mode?: BindImportDuplicateMode;
  },
): Promise<BindImportResult> {
  return apiFetch<BindImportResult>(
    `/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/records/import`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.content,
        filename: input.filename ?? null,
        duplicate_mode: input.duplicate_mode ?? "skip",
      }),
    },
  );
}

export type ZoneExportFormat = "json" | "bind";

async function downloadFromResponse(
  response: Response,
  fallbackFilename: string,
): Promise<void> {
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  const { filenameFromContentDisposition, downloadBlob } = await import("@/lib/download");
  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );
  const blob = await response.blob();
  downloadBlob(filename, blob);
}

export async function exportHostedZone(
  zoneId: string,
  format: ZoneExportFormat,
): Promise<void> {
  const response = await fetch(
    `${getApiUrl()}/api/v1/hosted-zones/${encodeURIComponent(zoneId)}/export?format=${format}`,
    { method: "GET", credentials: "include" },
  );
  await downloadFromResponse(
    response,
    format === "json" ? "hosted-zone.json" : "hosted-zone.zone",
  );
}

export async function exportHostedZones(
  zoneIds: string[],
  format: ZoneExportFormat,
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/api/v1/hosted-zones/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ zone_ids: zoneIds, format }),
  });
  await downloadFromResponse(
    response,
    format === "json" ? "hosted-zones-export.json" : "hosted-zones-export.zip",
  );
}
