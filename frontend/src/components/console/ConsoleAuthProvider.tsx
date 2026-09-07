"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, getCurrentUser, type AuthUser } from "@/lib/api";
import { ensureMockSession, getMockSession, type MockSession } from "@/lib/mock/session";

type ConsoleAuthState = {
  user: AuthUser | null;
  session: MockSession;
  ready: boolean;
  error: string;
};

const defaultSession = (): MockSession => {
  ensureMockSession();
  return getMockSession();
};

const ConsoleAuthContext = createContext<ConsoleAuthState>({
  user: null,
  session: {
    id: "demo-user",
    name: "avi",
    workgroup: "Workpunkt (497535504622)",
  },
  ready: false,
  error: "",
});

export function ConsoleAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<MockSession>(defaultSession);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const current = await getCurrentUser();
        if (cancelled) return;

        if (!current) {
          const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
          router.replace(`/login${next}`);
          setUser(null);
          setError("");
          setReady(true);
          return;
        }

        setUser(current);
        setSession((prev) => ({
          ...prev,
          name: current.email.split("@")[0] || prev.name,
        }));
        setError("");
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to reach the API. Is the backend running?",
        );
        router.replace("/login");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const value = useMemo(
    () => ({ user, session, ready, error }),
    [user, session, ready, error],
  );

  return (
    <ConsoleAuthContext.Provider value={value}>{children}</ConsoleAuthContext.Provider>
  );
}

export function useConsoleAuth(): ConsoleAuthState {
  return useContext(ConsoleAuthContext);
}
