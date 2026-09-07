export type HostedZoneType = "Public" | "Private";

export type MockHostedZone = {
  id: string;
  name: string;
  type: HostedZoneType;
  recordCount: number;
  description: string;
  createdBy?: string;
  comment?: string;
};

/** Start empty to match AWS console empty state; create zones via the UI. */
export const INITIAL_HOSTED_ZONES: MockHostedZone[] = [];

export function generateHostedZoneId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 13; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `Z${suffix}`;
}

export function normalizeDomainName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  return trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
}
