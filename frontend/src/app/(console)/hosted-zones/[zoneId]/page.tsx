"use client";

import { useParams } from "next/navigation";
import { HostedZoneDetailView } from "@/components/console/HostedZoneDetailView";

export default function HostedZoneDetailPage() {
  const params = useParams<{ zoneId: string }>();
  return <HostedZoneDetailView zoneId={params.zoneId} />;
}
