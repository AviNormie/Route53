"use client";

import { useState } from "react";
import { ThumbDownIcon, ThumbUpIcon } from "@/components/ui/icons";

type FeedbackValue = "yes" | "no" | null;

export function Feedback() {
  const [selected, setSelected] = useState<FeedbackValue>(null);

  return (
    <section
      id="contact"
      className="page-shell py-[var(--section-space)]"
      aria-labelledby="feedback-heading"
    >
      <div className="feedback-banner">
        <div className="feedback-banner__copy">
          <h2 id="feedback-heading" className="feedback-banner__title">
            Did you find what you were looking for today?
          </h2>
          <p className="feedback-banner__subtitle">
            Let us know so we can improve the quality of the content on our pages
          </p>
        </div>

        <div className="feedback-banner__actions" role="group" aria-label="Page feedback">
          <button
            type="button"
            className={`feedback-banner__btn${selected === "yes" ? " is-selected" : ""}`}
            aria-pressed={selected === "yes"}
            onClick={() => setSelected("yes")}
          >
            Yes
            <ThumbUpIcon />
          </button>
          <button
            type="button"
            className={`feedback-banner__btn${selected === "no" ? " is-selected" : ""}`}
            aria-pressed={selected === "no"}
            onClick={() => setSelected("no")}
          >
            No
            <ThumbDownIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
