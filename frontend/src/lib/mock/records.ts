export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SOA" | "SRV" | "CAA";

export type MockDnsRecord = {
  id: string;
  zoneId: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
  routingPolicy: string;
};

export const INITIAL_RECORDS: MockDnsRecord[] = [
  {
    id: "rec-ex-ns",
    zoneId: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "NS",
    value: "ns-123.awsdns-12.com.\nns-456.awsdns-45.net.",
    ttl: 172800,
    routingPolicy: "Simple",
  },
  {
    id: "rec-ex-soa",
    zoneId: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "SOA",
    value: "ns-123.awsdns-12.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
    ttl: 900,
    routingPolicy: "Simple",
  },
  {
    id: "rec-ex-a",
    zoneId: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "A",
    value: "192.0.2.44",
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-ex-www",
    zoneId: "Z0312345678ABCDEFG",
    name: "www.example.com",
    type: "CNAME",
    value: "example.com",
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-ex-mx",
    zoneId: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "MX",
    value: "10 mail.example.com",
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-ex-txt",
    zoneId: "Z0312345678ABCDEFG",
    name: "example.com",
    type: "TXT",
    value: '"v=spf1 include:_spf.example.com ~all"',
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-org-ns",
    zoneId: "Z0398765432HIJKLMN",
    name: "example.org",
    type: "NS",
    value: "ns-111.awsdns-11.com.\nns-222.awsdns-22.net.",
    ttl: 172800,
    routingPolicy: "Simple",
  },
  {
    id: "rec-org-soa",
    zoneId: "Z0398765432HIJKLMN",
    name: "example.org",
    type: "SOA",
    value: "ns-111.awsdns-11.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
    ttl: 900,
    routingPolicy: "Simple",
  },
  {
    id: "rec-org-a",
    zoneId: "Z0398765432HIJKLMN",
    name: "example.org",
    type: "A",
    value: "203.0.113.10",
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-org-aaaa",
    zoneId: "Z0398765432HIJKLMN",
    name: "example.org",
    type: "AAAA",
    value: "2001:db8::10",
    ttl: 300,
    routingPolicy: "Simple",
  },
  {
    id: "rec-dev-ns",
    zoneId: "Z0456789012OPQRSTU",
    name: "myapp.dev",
    type: "NS",
    value: "ns-333.awsdns-33.com.\nns-444.awsdns-44.net.",
    ttl: 172800,
    routingPolicy: "Simple",
  },
  {
    id: "rec-dev-soa",
    zoneId: "Z0456789012OPQRSTU",
    name: "myapp.dev",
    type: "SOA",
    value: "ns-333.awsdns-33.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
    ttl: 900,
    routingPolicy: "Simple",
  },
  {
    id: "rec-dev-a",
    zoneId: "Z0456789012OPQRSTU",
    name: "myapp.dev",
    type: "A",
    value: "198.51.100.20",
    ttl: 60,
    routingPolicy: "Simple",
  },
  {
    id: "rec-dev-api",
    zoneId: "Z0456789012OPQRSTU",
    name: "api.myapp.dev",
    type: "A",
    value: "198.51.100.21",
    ttl: 60,
    routingPolicy: "Simple",
  },
  {
    id: "rec-dev-txt",
    zoneId: "Z0456789012OPQRSTU",
    name: "_verify.myapp.dev",
    type: "TXT",
    value: '"route53-clone-verification=abc123"',
    ttl: 300,
    routingPolicy: "Simple",
  },
];

export function generateRecordId(): string {
  return `rec-${Math.random().toString(36).slice(2, 11)}`;
}
