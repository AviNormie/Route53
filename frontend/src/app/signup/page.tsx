"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

function ExternalLinkIcon() {
  return (
    <svg
      className="signup-external"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 2.5H9.5V8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 2.5L2.5 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError("Enter your root user email address.");
      setSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      setSubmitted(false);
      return;
    }

    setEmailError("");
    setSubmitted(true);
  };

  return (
    <div className="signup-page">
      <button type="button" className="signup-lang" aria-haspopup="listbox" aria-label="Select language">
        English
        <span className="signup-lang__chevron" aria-hidden="true" />
      </button>

      <Link href="/" className="signup-logo" aria-label="Amazon Web Services home">
        <Image
          src="/images/auth/aws-logo.png"
          alt="AWS"
          width={168}
          height={102}
          priority
          className="signup-logo__img"
        />
      </Link>

      <main className="signup-main">
        <section className="signup-marketing" aria-labelledby="signup-marketing-heading">
          <h1 id="signup-marketing-heading" className="signup-marketing__title">
            Try AWS at no cost for up to 6 months
          </h1>
          <p className="signup-marketing__copy">
            Start with USD $100 in AWS credits, plus earn up to USD $100 by completing various
            activities.
          </p>
          <div className="signup-marketing__art">
            <Image
              src="/images/auth/rocket.png"
              alt=""
              width={220}
              height={146}
              className="signup-rocket"
              priority
            />
          </div>
        </section>

        <div className="signup-divider" aria-hidden="true" />

        <section className="signup-form-panel" aria-labelledby="signup-form-heading">
          <h2 id="signup-form-heading" className="signup-form__title">
            Sign up for AWS
          </h2>

          {submitted ? (
            <p className="signup-success" role="status">
              Check your inbox to verify <strong>{email.trim()}</strong>
              {accountName.trim() ? ` for account “${accountName.trim()}”` : ""}. This is a demo —
              no email was sent.
            </p>
          ) : (
            <form className="signup-form" onSubmit={onSubmit} noValidate>
              <div className="signup-field">
                <label className="signup-field__label" htmlFor="root-email">
                  Root user email address
                </label>
                <p className="signup-field__hint" id="root-email-hint">
                  Used for account recovery and as described in the{" "}
                  <a href="#" className="signup-link">
                    AWS Privacy Notice
                    <ExternalLinkIcon />
                  </a>
                </p>
                <input
                  id="root-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className={`signup-field__input${emailError ? " is-invalid" : ""}`}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "root-email-error root-email-hint" : "root-email-hint"}
                />
                {emailError ? (
                  <p id="root-email-error" className="signup-field__error" role="alert">
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div className="signup-field">
                <label className="signup-field__label" htmlFor="account-name">
                  AWS account name
                </label>
                <p className="signup-field__hint" id="account-name-hint">
                  Choose a name for your account. You can change this name in your account settings
                  after you sign up.
                </p>
                <input
                  id="account-name"
                  name="accountName"
                  type="text"
                  autoComplete="organization"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  className="signup-field__input"
                  aria-describedby="account-name-hint"
                />
              </div>

              <button type="submit" className="signup-btn signup-btn--primary">
                Verify email address
              </button>
            </form>
          )}

          <div className="signup-or" role="separator" aria-label="or">
            <span>OR</span>
          </div>

          <Link href="/login" className="signup-btn signup-btn--secondary">
            Sign in to an existing AWS account
          </Link>

          <p className="signup-cookies">
            This site uses essential cookies. See our{" "}
            <a href="#" className="signup-link signup-link--underline">
              Cookie Notice
              <ExternalLinkIcon />
            </a>{" "}
            for more information.
          </p>
        </section>
      </main>

      <div className="signup-bg" aria-hidden="true">
        <Image
          src="/images/auth/signup-bg-light.png"
          alt=""
          width={1440}
          height={266}
          className="signup-bg__img"
          priority
        />
      </div>
    </div>
  );
}
