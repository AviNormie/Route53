"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";

const RATINGS = [1, 2, 3, 4, 5] as const;

type SiteFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SiteFeedbackModal({ open, onClose }: SiteFeedbackModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setRating(null);
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="site-feedback-modal" role="presentation">
      <button
        type="button"
        className="site-feedback-modal__backdrop"
        aria-label="Close feedback"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="site-feedback-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          type="button"
          className="site-feedback-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        {submitted ? (
          <div className="site-feedback-modal__thanks">
            <h2 id={titleId} className="site-feedback-modal__title">
              Thanks for your feedback
            </h2>
            <p className="site-feedback-modal__copy">
              Your response helps us improve this website.
            </p>
            <button type="button" className="site-feedback-modal__continue is-enabled" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="site-feedback-modal__title">
              Based on your visit today, how satisfied are you with the website?
            </h2>

            <div
              className="site-feedback-modal__scale"
              role="radiogroup"
              aria-label="Satisfaction rating from 1 to 5"
            >
              {RATINGS.map((value) => {
                const checked = rating === value;
                return (
                  <label key={value} className="site-feedback-modal__option">
                    <input
                      type="radio"
                      name="site-feedback-rating"
                      value={value}
                      checked={checked}
                      onChange={() => setRating(value)}
                    />
                    <span className="site-feedback-modal__radio" aria-hidden="true" />
                    <span className="site-feedback-modal__number">{value}</span>
                    {value === 1 ? (
                      <span className="site-feedback-modal__hint">Not satisfied at all</span>
                    ) : null}
                    {value === 5 ? (
                      <span className="site-feedback-modal__hint">Very satisfied</span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <div className="site-feedback-modal__footer">
              <button
                type="button"
                className={`site-feedback-modal__continue${rating ? " is-enabled" : ""}`}
                disabled={!rating}
                onClick={() => setSubmitted(true)}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
