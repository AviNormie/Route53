"use client";

import { ConsoleLayout } from "@/components/console/ConsoleLayout";

type Props = {
  title: string;
  breadcrumb?: string;
  description?: string;
};

export function ConsolePlaceholder({ title, breadcrumb, description }: Props) {
  return (
    <ConsoleLayout breadcrumb={breadcrumb ?? title}>
      <div className="console-page">
        <h1 className="console-page__title">{title}</h1>
        <p className="console-page__muted">
          {description ??
            "This console page is a visual placeholder. It will be wired to the FastAPI backend in a later phase."}
        </p>
      </div>
    </ConsoleLayout>
  );
}
