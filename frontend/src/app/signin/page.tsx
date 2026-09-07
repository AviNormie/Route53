"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  "English",
  "Deutsch",
  "Español",
  "Français",
  "日本語",
  "한국어",
  "Português",
  "中文(简体)",
] as const;

function ExternalLinkIcon() {
  return (
    <svg
      className="signin-external"
      width="11"
      height="11"
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke="#0073bb" strokeWidth="1.5" />
      <path d="M8 7v4.5" stroke="#0073bb" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.8" r="0.9" fill="#0073bb" />
    </svg>
  );
}

export default function SigninPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [multiSession, setMultiSession] = useState<"enabled" | "disabled">("disabled");
  const [bannerOpen, setBannerOpen] = useState(true);
  const [accountId, setAccountId] = useState("");
  const [remember, setRemember] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const langRef = useRef<HTMLDivElement>(null);
  const multiRef = useRef<HTMLDivElement>(null);
  const langMenuId = useId();
  const multiMenuId = useId();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (multiRef.current && !multiRef.current.contains(target)) {
        setMultiOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLangOpen(false);
        setMultiOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountId.trim() || !username.trim() || !password.trim()) {
      setError("Enter your account ID, IAM username, and password.");
      return;
    }
    setError("");
    router.push("/");
  };

  return (
    <div className="signin-page">
      <div className="signin-topbar">
        <a href="#" className="signin-topbar__link">
          Provide feedback
        </a>

        <div ref={multiRef} className="signin-dropdown">
          <button
            type="button"
            className="signin-topbar__link"
            aria-haspopup="menu"
            aria-expanded={multiOpen}
            aria-controls={multiMenuId}
            onClick={() => {
              setMultiOpen((value) => !value);
              setLangOpen(false);
            }}
          >
            Multi-session {multiSession}
            <span
              className={`signin-chevron ${multiOpen ? "is-up" : ""}`}
              aria-hidden="true"
            />
          </button>
          {multiOpen ? (
            <div id={multiMenuId} role="menu" className="signin-menu signin-menu--multi">
              <button
                type="button"
                role="menuitem"
                className={`signin-menu__item ${multiSession === "enabled" ? "is-active" : ""}`}
                onClick={() => {
                  setMultiSession("enabled");
                  setMultiOpen(false);
                }}
              >
                Multi-session enabled
              </button>
              <button
                type="button"
                role="menuitem"
                className={`signin-menu__item ${multiSession === "disabled" ? "is-active" : ""}`}
                onClick={() => {
                  setMultiSession("disabled");
                  setMultiOpen(false);
                }}
              >
                Multi-session disabled
              </button>
              <a href="#" role="menuitem" className="signin-menu__item signin-menu__item--link">
                Learn More
                <ExternalLinkIcon />
              </a>
            </div>
          ) : null}
        </div>

        <div ref={langRef} className="signin-dropdown">
          <button
            type="button"
            className="signin-lang"
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            aria-controls={langMenuId}
            onClick={() => {
              setLangOpen((value) => !value);
              setMultiOpen(false);
            }}
          >
            {language}
            <span className={`signin-chevron ${langOpen ? "is-up" : ""}`} aria-hidden="true" />
          </button>
          {langOpen ? (
            <ul id={langMenuId} role="listbox" className="signin-menu signin-menu--lang">
              {LANGUAGES.map((item) => (
                <li key={item} role="option" aria-selected={language === item}>
                  <button
                    type="button"
                    className={`signin-menu__item ${language === item ? "is-active" : ""}`}
                    onClick={() => {
                      setLanguage(item);
                      setLangOpen(false);
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <Link href="/" className="signin-logo" aria-label="Amazon Web Services home">
        <Image
          src="/images/auth/aws-logo.png"
          alt="AWS"
          width={168}
          height={102}
          priority
          className="signin-logo__img"
        />
      </Link>

      <div className="signin-shell">
        {bannerOpen ? (
          <aside className="signin-banner" aria-label="Sign-in update notice">
            <div className="signin-banner__body">
              <InfoIcon className="signin-banner__icon" />
              <div className="signin-banner__copy">
                <p className="signin-banner__title">AWS sign-in is getting an update</p>
                <p className="signin-banner__text">
                  Starting in mid-2026, Amazon Web Services (AWS) is introducing updates to the AWS
                  sign-in and sign-up pages. These updates include new options for how you create and
                  access your account.{" "}
                  <a href="#" className="signin-link">
                    Learn more
                    <ExternalLinkIcon />
                  </a>
                </p>
              </div>
            </div>
            <div className="signin-banner__actions">
              <button type="button" className="signin-banner__cta">
                Change to new experience
              </button>
              <button
                type="button"
                className="signin-banner__close"
                aria-label="Dismiss notice"
                onClick={() => setBannerOpen(false)}
              >
                ×
              </button>
            </div>
          </aside>
        ) : null}

        <div className="signin-content">
          <section className="signin-card" aria-labelledby="signin-heading">
            <h1 id="signin-heading" className="signin-card__title">
              IAM user sign in
              <button type="button" className="signin-card__info" aria-label="About IAM user sign in">
                <InfoIcon />
              </button>
            </h1>

            <form className="signin-form" onSubmit={onSubmit} noValidate>
              <div className="signin-field">
                <div className="signin-field__label-row">
                  <label className="signin-field__label" htmlFor="account-id">
                    Account ID or alias
                  </label>
                  <a href="#" className="signin-dotted">
                    (Don&apos;t have?)
                  </a>
                </div>
                <input
                  id="account-id"
                  name="accountId"
                  type="text"
                  autoComplete="organization"
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    if (error) setError("");
                  }}
                  className="signin-field__input"
                />
              </div>

              <label className="signin-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember this account</span>
              </label>

              <div className="signin-field">
                <label className="signin-field__label" htmlFor="iam-username">
                  IAM username
                </label>
                <input
                  id="iam-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) setError("");
                  }}
                  className="signin-field__input"
                />
              </div>

              <div className="signin-field">
                <label className="signin-field__label" htmlFor="iam-password">
                  Password
                </label>
                <input
                  id="iam-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  className="signin-field__input"
                />
                <div className="signin-password-row">
                  <label className="signin-check">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(event) => setShowPassword(event.target.checked)}
                    />
                    <span>Show Password</span>
                  </label>
                  <a href="#" className="signin-dotted">
                    Having trouble?
                  </a>
                </div>
              </div>

              {error ? (
                <p className="signin-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="signin-btn signin-btn--primary">
                Sign in
              </button>
            </form>

            <Link href="/login" className="signin-btn signin-btn--secondary">
              Sign in using root user email
            </Link>

            <Link href="/signup" className="signin-create">
              Create a new AWS account
            </Link>
          </section>

          <aside className="signin-promo" aria-label="Amazon Lightsail">
            <Image
              src="/images/auth/lightsail-promo.png"
              alt="Amazon Lightsail — Lightsail is the easiest way to get started on AWS"
              width={640}
              height={490}
              className="signin-promo__img"
              priority
            />
          </aside>
        </div>

        <p className="signin-legal">
          By continuing, you agree to{" "}
          <a href="#" className="signin-legal__link">
            AWS Customer Agreement
          </a>{" "}
          or other agreement for AWS services, and the{" "}
          <a href="#" className="signin-legal__link">
            Privacy Notice
          </a>
          . This site uses essential cookies. See the{" "}
          <a href="#" className="signin-legal__link">
            Cookie Notice
          </a>{" "}
          for more information.
        </p>
        <p className="signin-copyright">
          © 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.
        </p>
      </div>

      <div className="signin-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/background-left.png"
          alt=""
          className="signin-bg__side signin-bg__side--left"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth/background-right.png"
          alt=""
          className="signin-bg__side signin-bg__side--right"
        />
      </div>
    </div>
  );
}
