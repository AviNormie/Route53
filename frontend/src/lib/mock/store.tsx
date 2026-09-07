"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  generateHostedZoneId,
  INITIAL_HOSTED_ZONES,
  normalizeDomainName,
  type HostedZoneType,
  type MockHostedZone,
} from "@/lib/mock/hostedZones";
import {
  generateRecordId,
  INITIAL_RECORDS,
  type DnsRecordType,
  type MockDnsRecord,
} from "@/lib/mock/records";

const STORAGE_KEY = "r53-mock-dns-store-v2";

type StoreState = {
  zones: MockHostedZone[];
  records: MockDnsRecord[];
};

type CreateZoneInput = {
  name: string;
  description: string;
  type: HostedZoneType;
};

type CreateRecordInput = {
  zoneId: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
  routingPolicy?: string;
};

type UpdateRecordInput = {
  id: string;
  name: string;
  type: DnsRecordType;
  value: string;
  ttl: number;
  routingPolicy?: string;
};

type MockDnsStore = {
  zones: MockHostedZone[];
  records: MockDnsRecord[];
  hydrated: boolean;
  createZone: (input: CreateZoneInput) => MockHostedZone;
  deleteZone: (id: string) => void;
  getZone: (id: string) => MockHostedZone | undefined;
  getRecordsForZone: (zoneId: string) => MockDnsRecord[];
  createRecord: (input: CreateRecordInput) => MockDnsRecord;
  updateRecord: (input: UpdateRecordInput) => MockDnsRecord | undefined;
  deleteRecord: (id: string) => void;
};

const MockDnsContext = createContext<MockDnsStore | null>(null);

function defaultNsValue(): string {
  return "ns-988.awsdns-59.net.\nns-1358.awsdns-41.org.\nns-321.awsdns-40.com.\nns-1624.awsdns-11.co.uk.";
}

function syncRecordCounts(zones: MockHostedZone[], records: MockDnsRecord[]): MockHostedZone[] {
  return zones.map((zone) => ({
    ...zone,
    recordCount: records.filter((r) => r.zoneId === zone.id).length,
  }));
}

function loadState(): StoreState {
  if (typeof window === "undefined") {
    return { zones: INITIAL_HOSTED_ZONES, records: INITIAL_RECORDS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (Array.isArray(parsed.zones) && Array.isArray(parsed.records)) {
        return {
          zones: syncRecordCounts(parsed.zones, parsed.records),
          records: parsed.records,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return {
    zones: INITIAL_HOSTED_ZONES,
    records: INITIAL_RECORDS,
  };
}

export function MockDnsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    zones: INITIAL_HOSTED_ZONES,
    records: INITIAL_RECORDS,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const createZone = useCallback((input: CreateZoneInput) => {
    const name = normalizeDomainName(input.name);
    const id = generateHostedZoneId();
    const zone: MockHostedZone = {
      id,
      name,
      type: input.type,
      description: input.description.trim(),
      recordCount: 2,
      createdBy: "Route 53",
    };
    const ns: MockDnsRecord = {
      id: generateRecordId(),
      zoneId: id,
      name,
      type: "NS",
      value: defaultNsValue(),
      ttl: 172800,
      routingPolicy: "Simple",
      alias: false,
    };
    const soa: MockDnsRecord = {
      id: generateRecordId(),
      zoneId: id,
      name,
      type: "SOA",
      value: `ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400`,
      ttl: 900,
      routingPolicy: "Simple",
      alias: false,
    };
    setState((prev) => {
      const records = [...prev.records, ns, soa];
      const zones = syncRecordCounts([...prev.zones, zone], records);
      return { zones, records };
    });
    return zone;
  }, []);

  const deleteZone = useCallback((id: string) => {
    setState((prev) => {
      const records = prev.records.filter((r) => r.zoneId !== id);
      const zones = prev.zones.filter((z) => z.id !== id);
      return { zones, records };
    });
  }, []);

  const getZone = useCallback(
    (id: string) => state.zones.find((z) => z.id === id),
    [state.zones],
  );

  const getRecordsForZone = useCallback(
    (zoneId: string) => state.records.filter((r) => r.zoneId === zoneId),
    [state.records],
  );

  const createRecord = useCallback((input: CreateRecordInput) => {
    const record: MockDnsRecord = {
      id: generateRecordId(),
      zoneId: input.zoneId,
      name: input.name.trim(),
      type: input.type,
      value: input.value.trim(),
      ttl: input.ttl,
      routingPolicy: input.routingPolicy ?? "Simple",
    };
    setState((prev) => {
      const records = [...prev.records, record];
      return { zones: syncRecordCounts(prev.zones, records), records };
    });
    return record;
  }, []);

  const updateRecord = useCallback((input: UpdateRecordInput) => {
    let updated: MockDnsRecord | undefined;
    setState((prev) => {
      const records = prev.records.map((r) => {
        if (r.id !== input.id) return r;
        updated = {
          ...r,
          name: input.name.trim(),
          type: input.type,
          value: input.value.trim(),
          ttl: input.ttl,
          routingPolicy: input.routingPolicy ?? r.routingPolicy,
        };
        return updated;
      });
      return { zones: syncRecordCounts(prev.zones, records), records };
    });
    return updated;
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setState((prev) => {
      const records = prev.records.filter((r) => r.id !== id);
      return { zones: syncRecordCounts(prev.zones, records), records };
    });
  }, []);

  const value = useMemo<MockDnsStore>(
    () => ({
      zones: state.zones,
      records: state.records,
      hydrated,
      createZone,
      deleteZone,
      getZone,
      getRecordsForZone,
      createRecord,
      updateRecord,
      deleteRecord,
    }),
    [
      state.zones,
      state.records,
      hydrated,
      createZone,
      deleteZone,
      getZone,
      getRecordsForZone,
      createRecord,
      updateRecord,
      deleteRecord,
    ],
  );

  return <MockDnsContext.Provider value={value}>{children}</MockDnsContext.Provider>;
}

export function useMockDns(): MockDnsStore {
  const ctx = useContext(MockDnsContext);
  if (!ctx) {
    throw new Error("useMockDns must be used within MockDnsProvider");
  }
  return ctx;
}
