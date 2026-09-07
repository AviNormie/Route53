export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA" | "SRV" | "CAA";

export type MockDnsRecord = {
  id: string;
  zoneId: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
  routingPolicy: string;
  alias?: boolean;
  differentiator?: string;
  healthCheckId?: string;
  evaluateTargetHealth?: boolean;
};

export const INITIAL_RECORDS: MockDnsRecord[] = [];

export function generateRecordId(): string {
  return `rec-${Math.random().toString(36).slice(2, 11)}`;
}

export const RECORD_TYPE_OPTIONS: { value: DnsRecordType; label: string }[] = [
  { value: "A", label: "A – Routes traffic to an IPv4 address and some AWS resources" },
  { value: "AAAA", label: "AAAA – Routes traffic to an IPv6 address and some AWS resources" },
  { value: "CNAME", label: "CNAME – Routes traffic to another domain name" },
  { value: "MX", label: "MX – Routes traffic to mail servers" },
  { value: "TXT", label: "TXT – Holds text-based verification values" },
  { value: "NS", label: "NS – Name servers for the hosted zone" },
  { value: "SOA", label: "SOA – Start of authority" },
  { value: "SRV", label: "SRV – Service locator" },
  { value: "CAA", label: "CAA – Certificate Authority Authorization" },
];
