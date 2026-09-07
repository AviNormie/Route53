"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaAws } from "react-icons/fa";
import { AuthUser, getCurrentUser, logout } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const current = await getCurrentUser();
        if (cancelled) return;
        if (!current) {
          router.replace("/login");
          return;
        }
        setUser(current);
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSignOut = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  if (loading || !user) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-page__loading">Loading console…</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <Link href="/" className="dashboard-topbar__brand" aria-label="Amazon Web Services home">
          <FaAws aria-hidden="true" />
          <span>Console</span>
        </Link>
        <div className="dashboard-topbar__actions">
          <span className="dashboard-topbar__email">{user.email}</span>
          <button type="button" className="dashboard-topbar__signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <h1 className="dashboard-main__title">Route 53</h1>
        <p className="dashboard-main__copy">
          You&apos;re signed in. Hosted zones and DNS records will appear here in a later step.
        </p>
      </main>
    </div>
  );
}
