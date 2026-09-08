import type { Metadata } from "next";

/** Shared page title/description for App Router metadata exports. */
export function pageMeta(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? `${title} — Amazon Route 53 Clone console`,
  };
}
