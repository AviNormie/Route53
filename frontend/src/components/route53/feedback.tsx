"use client";

import { useState } from "react";
import { ThumbDownIcon, ThumbUpIcon } from "@/components/ui/icons";

type FeedbackValue = "yes" | "no" | null;

export function Feedback() {
  const [selected, setSelected] = useState<FeedbackValue>(null);

  return (
    <section className="page-shell py-[var(--section-space)]" aria-labelledby="feedback-heading">
      <div className="feedback-gradient flex flex-col gap-6 rounded-[1.25rem] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
        <div className="max-w-[36rem]">
          <h2
            id="feedback-heading"
            className="font-display m-0 text-[clamp(1.35rem,2.2vw,1.85rem)] font-bold leading-snug text-aws-ink"
          >
            Did you find what you were looking for today?
          </h2>
          <p className="mt-2 m-0 text-[0.95rem] leading-relaxed text-aws-ink/80">
            Let us know so we can improve the quality of the content on our pages
          </p>
        </div>

        <div className="flex flex-wrap gap-3" role="group" aria-label="Page feedback">
          <button
            type="button"
            className={`btn-pill btn-pill-primary min-w-[7rem] ${selected === "yes" ? "btn-pill-selected" : ""}`}
            aria-pressed={selected === "yes"}
            onClick={() => setSelected("yes")}
          >
            Yes
            <ThumbUpIcon />
          </button>
          <button
            type="button"
            className={`btn-pill btn-pill-primary min-w-[7rem] ${selected === "no" ? "btn-pill-selected" : ""}`}
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
