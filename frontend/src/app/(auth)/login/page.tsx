"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FaAws } from "react-icons/fa";
import {
  AmazonIcon,
  AppleIcon,
  GitHubIcon,
  GoogleColorIcon,
} from "@/components/ui/social-icons";
import { ApiError, getCurrentUser, login, signup } from "@/lib/api";

const socialProviders = [
  { id: "google", label: "Continue with Google", Icon: GoogleColorIcon },
  { id: "apple", label: "Continue with Apple", Icon: AppleIcon },
  { id: "github", label: "Continue with GitHub", Icon: GitHubIcon },
  { id: "amazon", label: "Continue with Amazon", Icon: AmazonIcon },
] as const;

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await getCurrentUser();
        if (!cancelled && user) router.replace("/dashboard");
      } catch {
        // stay on login
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const isSignup = mode === "signup";
  const passwordVisible = isSignup || showPassword;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setPassword("");
    setShowPassword(next === "signup");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (!isSignup && !showPassword) {
      setShowPassword(true);
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (isSignup && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : isSignup
            ? "Unable to create account. Check that the API is running."
            : "Unable to sign in. Check that the API is running.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Link href="/" className="login-page__logo" aria-label="Amazon Web Services home">
        <FaAws aria-hidden="true" />
      </Link>

      <main className="login-page__main">
        <div className=" gradient-glow--card is-glowing login-card-glow">
          <section className="login-card" aria-labelledby="login-heading">
            <h1 id="login-heading" className="login-card__title">
              {isSignup ? "Create account" : "Get started"}
            </h1>

            <form className="login-card__form" onSubmit={onSubmit} noValidate>
              <label className="login-field" htmlFor="login-email">
                <span className="login-field__label">Email</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="username@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  className={`login-field__input${error && !passwordVisible ? " is-invalid" : ""}`}
                  required
                  disabled={submitting}
                />
              </label>

              {passwordVisible ? (
                <label className="login-field" htmlFor="login-password">
                  <span className="login-field__label">Password</span>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    className={`login-field__input${error ? " is-invalid" : ""}`}
                    required
                    autoFocus={!isSignup}
                    disabled={submitting}
                    minLength={isSignup ? 8 : undefined}
                  />
                </label>
              ) : null}

              {error ? (
                <p className="login-field__error" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="login-btn login-btn--primary"
                disabled={submitting}
              >
                {submitting
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignup
                    ? "Create account"
                    : "Continue"}
              </button>
            </form>

            <div className="login-divider" role="separator" aria-label="or">
              <span>OR</span>
            </div>

            <div className="login-social">
              {socialProviders.map(({ id, label, Icon }) => (
                <button key={id} type="button" className="login-btn login-btn--social">
                  <span className="login-btn__icon">
                    <Icon />
                  </span>
                  <span className="login-btn__label">{label}</span>
                </button>
              ))}
            </div>

            <p className="login-legal">
              By clicking &quot;{isSignup ? "Create account" : "Continue"}&quot; or continuing
              with an alternative sign-in method, you agree to the{" "}
              <a href="#">AWS Customer Agreement</a>, and you acknowledge you have read the{" "}
              <a href="#">AWS Privacy Notice</a>. By continuing, you will create an{" "}
              <a href="#">AWS Builder ID</a>.
            </p>

            <div className="login-card__footer">
              {isSignup ? (
                <p className="login-card__footer-text">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="login-card__footer-btn"
                    onClick={() => switchMode("signin")}
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="login-card__footer-text">
                  New to AWS?{" "}
                  <button
                    type="button"
                    className="login-card__footer-btn"
                    onClick={() => switchMode("signup")}
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="login-page__footer">
        <nav className="login-page__footer-links" aria-label="Legal">
          <a href="#">
            Privacy
            <span className="login-external" aria-hidden="true">
              ↗
            </span>
          </a>
          <span aria-hidden="true">|</span>
          <a href="#">
            Site terms
            <span className="login-external" aria-hidden="true">
              ↗
            </span>
          </a>
          <span aria-hidden="true">|</span>
          <a href="#">Cookie preferences</a>
        </nav>
        <p className="login-page__copyright">
          © 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
