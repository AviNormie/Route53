export type HostedZoneType = "Public" | "Private";

export type MockHostedZone = {
  id: string;
  name: string;
  type: HostedZoneType;
  recordCount: number;
  description: string;
  comment?: string;
};

export const INITIAL_HOSTED_ZONES: MockHostedZone[] = [
  {
    id: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "Public",
    recordCount: 6,
    description: "Primary production zone",
  },
  {
    id: "Z0398765432HIJKLMN",
    name: "example.org",
    type: "Public",
    recordCount: 4,
    description: "Marketing site",
  },
  {
    id: "Z0456789012OPQRSTU",
    name: "myapp.dev",
    type: "Public",
    recordCount: 5,
    description: "Application staging",
  },
];

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
