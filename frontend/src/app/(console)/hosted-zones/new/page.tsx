"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConsoleButton } from "@/components/console/ConsoleButton";
import { ConsoleCard } from "@/components/console/ConsoleCard";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ConsoleField, ConsoleInput, ConsoleTextarea } from "@/components/console/ConsoleInput";
import type { HostedZoneType } from "@/lib/mock/hostedZones";
import { useMockDns } from "@/lib/mock/store";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { createZone } = useMockDns();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<HostedZoneType>("Public");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Domain name is required.");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(trimmed)) {
      setError("Enter a valid domain name (for example, example.com).");
      return;
    }
    const zone = createZone({ name: trimmed, description, type });
    router.push(`/hosted-zones/${zone.id}`);
  };

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: "Create hosted zone" },
      ]}
    >
      <div className="console-page console-page--narrow">
        <h1 className="console-page__title">Create hosted zone</h1>
        <p className="console-page__muted">
          A hosted zone is a container for records that define how to route traffic for a domain.
        </p>

        <ConsoleCard>
          <form className="console-form" onSubmit={onSubmit}>
            <ConsoleField
              label="Domain name"
              htmlFor="hz-name"
              hint="You can use letters, numbers, and hyphens. Do not use spaces."
            >
              <ConsoleInput
                id="hz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example.com"
                autoComplete="off"
              />
            </ConsoleField>

            <ConsoleField label="Description — optional" htmlFor="hz-desc">
              <ConsoleTextarea
                id="hz-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </ConsoleField>

            <fieldset className="console-fieldset">
              <legend className="console-field__label">Type</legend>
              <label className="console-radio">
                <input
                  type="radio"
                  name="hz-type"
                  checked={type === "Public"}
                  onChange={() => setType("Public")}
                />
                <span>
                  <strong>Public hosted zone</strong>
                  <span className="console-radio__hint">
                    Create a hosted zone that can resolve DNS queries from the public internet.
                  </span>
                </span>
              </label>
              <label className="console-radio">
                <input
                  type="radio"
                  name="hz-type"
                  checked={type === "Private"}
                  onChange={() => setType("Private")}
                />
                <span>
                  <strong>Private hosted zone</strong>
                  <span className="console-radio__hint">
                    Create a hosted zone that resolves DNS queries only within selected VPCs
                    (mocked).
                  </span>
                </span>
              </label>
            </fieldset>

            {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}

            <div className="console-form__actions">
              <Link href="/hosted-zones" className="console-btn console-btn--normal">
                Cancel
              </Link>
              <ConsoleButton type="submit" variant="primary">
                Create hosted zone
              </ConsoleButton>
            </div>
          </form>
        </ConsoleCard>
      </div>
    </ConsoleLayout>
  );
}
