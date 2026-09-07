"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { FiSearch, FiXCircle } from "react-icons/fi";
import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { ApiError, createHostedZone, type HostedZoneType } from "@/lib/api";

const DESC_MAX = 256;
const TAG_LIMIT = 50;

type TagRow = {
  id: string;
  key: string;
  value: string;
  showKeyError: boolean;
};

function createTagRow(): TagRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: "",
    value: "",
    showKeyError: false,
  };
}

export default function CreateHostedZonePage() {
  const router = useRouter();
  const tagsId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<HostedZoneType>("Public");
  const [tags, setTags] = useState<TagRow[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const remainingTags = TAG_LIMIT - tags.length;

  const updateTag = (id: string, patch: Partial<TagRow>) => {
    setTags((prev) => prev.map((tag) => (tag.id === id ? { ...tag, ...patch } : tag)));
  };

  const addTag = () => {
    if (tags.length >= TAG_LIMIT) return;

    const withErrors = tags.map((tag) => ({
      ...tag,
      showKeyError: !tag.key.trim(),
    }));
    if (withErrors.some((tag) => tag.showKeyError)) {
      setTags(withErrors);
      return;
    }

    setTags((prev) => [...prev, createTagRow()]);
  };

  const removeTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  };

  const onSubmit = async (e: FormEvent) => {
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

    const validatedTags = tags.map((tag) => ({
      ...tag,
      showKeyError: !tag.key.trim(),
    }));
    if (validatedTags.some((tag) => tag.showKeyError)) {
      setTags(validatedTags);
      setError("Fix tag errors before creating the hosted zone.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const zone = await createHostedZone({
        name: trimmed,
        comment: description.trim() || undefined,
        type,
      });
      router.push(`/hosted-zones/${zone.id}?created=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create hosted zone.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConsoleLayout
      breadcrumbs={[
        { label: "Hosted zones", href: "/hosted-zones" },
        { label: "Create hosted zone" },
      ]}
    >
      <form className="console-page console-create-hz" onSubmit={(e) => void onSubmit(e)}>
        <div className="console-page__heading-row">
          <h1 className="console-page__title">Create hosted zone</h1>
          <a href="#" className="console-link">
            Info
          </a>
        </div>

        <section className="console-hz-config">
          <h2 className="console-hz-config__title">Hosted zone configuration</h2>
          <p className="console-hz-config__intro">
            A hosted zone is a container that holds information about how you want to route traffic
            for a domain, such as example.com, and its subdomains.
          </p>

          <div className="console-hz-field">
            <div className="console-hz-field__label-row">
              <label htmlFor="hz-name">Domain name</label>
              <a href="#" className="console-link">
                Info
              </a>
            </div>
            <p className="console-hz-field__help">
              This is the name of the domain that you want to route traffic for.
            </p>
            <input
              id="hz-name"
              className="console-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="example.com"
              autoComplete="off"
            />
            <p className="console-hz-field__hint">
              Valid characters: a-z, 0-9, ! &quot; # $ % &amp; &apos; ( ) * + , - / : ; &lt; = &gt; ?
              @ [ \ ] ^ _ ` {"{"} | {"}"} . ~
            </p>
          </div>

          <div className="console-hz-field">
            <div className="console-hz-field__label-row">
              <label htmlFor="hz-desc">Description - optional</label>
              <a href="#" className="console-link">
                Info
              </a>
            </div>
            <p className="console-hz-field__help">
              This value lets you distinguish hosted zones that have the same name.
            </p>
            <textarea
              id="hz-desc"
              className="console-textarea console-textarea--desc"
              rows={4}
              maxLength={DESC_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
              placeholder="The hosted zone is used for..."
            />
            <p className="console-hz-field__counter">
              The description can have up to {DESC_MAX} characters. {description.length}/{DESC_MAX}
            </p>
          </div>

          <div className="console-hz-field">
            <div className="console-hz-field__label-row">
              <span className="console-hz-field__legend">Type</span>
              <a href="#" className="console-link">
                Info
              </a>
            </div>
            <p className="console-hz-field__help">
              The type indicates whether you want to route traffic on the internet or in an Amazon
              VPC.
            </p>
            <div className="console-type-cards" role="radiogroup" aria-label="Hosted zone type">
              <button
                type="button"
                role="radio"
                aria-checked={type === "Public"}
                className={`console-type-card${type === "Public" ? " is-selected" : ""}`}
                onClick={() => setType("Public")}
              >
                <span className="console-type-card__radio" aria-hidden="true" />
                <span className="console-type-card__body">
                  <strong>Public hosted zone</strong>
                  <span>
                    A public hosted zone determines how traffic is routed on the internet.
                  </span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === "Private"}
                className={`console-type-card${type === "Private" ? " is-selected" : ""}`}
                onClick={() => setType("Private")}
              >
                <span className="console-type-card__radio" aria-hidden="true" />
                <span className="console-type-card__body">
                  <strong>Private hosted zone</strong>
                  <span>
                    A private hosted zone determines how traffic is routed within an Amazon VPC.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="console-hz-tags" aria-labelledby={`${tagsId}-heading`}>
          <div className="console-hz-field__label-row">
            <h2 id={`${tagsId}-heading`} className="console-hz-config__title">
              Tags
            </h2>
            <a href="#" className="console-link">
              Info
            </a>
          </div>
          <p className="console-hz-config__intro">
            Apply tags to hosted zones to help organize and identify them.
          </p>

          {tags.length === 0 ? (
            <p className="console-hz-tags__empty">No tags associated with the resource.</p>
          ) : (
            <div className="console-hz-tags__list">
              {tags.map((tag) => {
                const keyId = `${tagsId}-key-${tag.id}`;
                const valueId = `${tagsId}-value-${tag.id}`;
                return (
                  <div key={tag.id} className="console-hz-tag-row">
                    <div className="console-hz-tag-row__field">
                      <label htmlFor={keyId}>Key</label>
                      <div
                        className={`console-hz-tag-input${tag.showKeyError ? " is-invalid" : ""}`}
                      >
                        <FiSearch size={14} aria-hidden="true" />
                        <input
                          id={keyId}
                          value={tag.key}
                          placeholder="Enter key"
                          autoComplete="off"
                          aria-invalid={tag.showKeyError}
                          aria-describedby={
                            tag.showKeyError ? `${keyId}-error` : undefined
                          }
                          onChange={(e) =>
                            updateTag(tag.id, {
                              key: e.target.value,
                              showKeyError: false,
                            })
                          }
                          onBlur={() => {
                            if (!tag.key.trim()) {
                              updateTag(tag.id, { showKeyError: true });
                            }
                          }}
                        />
                      </div>
                      {tag.showKeyError ? (
                        <p id={`${keyId}-error`} className="console-hz-tag-error" role="alert">
                          <FiXCircle size={14} aria-hidden="true" />
                          <span>Key is empty.</span>
                        </p>
                      ) : null}
                    </div>

                    <div className="console-hz-tag-row__field">
                      <label htmlFor={valueId}>
                        Value - <em>optional</em>
                      </label>
                      <div className="console-hz-tag-input">
                        <FiSearch size={14} aria-hidden="true" />
                        <input
                          id={valueId}
                          value={tag.value}
                          placeholder="Enter value"
                          autoComplete="off"
                          onChange={(e) => updateTag(tag.id, { value: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="console-hz-tag-row__actions">
                      <button
                        type="button"
                        className="console-btn console-btn--normal"
                        onClick={() => removeTag(tag.id)}
                      >
                        Remove tag
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="console-btn console-btn--normal"
            onClick={addTag}
            disabled={remainingTags <= 0}
          >
            Add tag
          </button>
          <p className="console-hz-field__hint">
            You can add up to {remainingTags} more tag{remainingTags === 1 ? "" : "s"}.
          </p>
        </section>

        {error ? <p className="console-inline-msg console-inline-msg--error">{error}</p> : null}

        <div className="console-create-hz__actions">
          <Link href="/hosted-zones" className="console-link console-create-hz__cancel">
            Cancel
          </Link>
          <button type="submit" className="console-btn console-btn--primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create hosted zone"}
          </button>
        </div>
      </form>
    </ConsoleLayout>
  );
}
