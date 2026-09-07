"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VisualMode = "browser" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ConsoleThemeState = {
  visualMode: VisualMode;
  resolvedTheme: ResolvedTheme;
  language: string;
  setVisualMode: (mode: VisualMode) => void;
  setLanguage: (language: string) => void;
};

const STORAGE_KEY = "route53-console-visual-mode";
const LANGUAGE_KEY = "route53-console-language";

const ConsoleThemeContext = createContext<ConsoleThemeState | null>(null);

function resolveTheme(mode: VisualMode, prefersDark: boolean): ResolvedTheme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return prefersDark ? "dark" : "light";
}

export function ConsoleThemeProvider({ children }: { children: ReactNode }) {
  const [visualMode, setVisualModeState] = useState<VisualMode>("dark");
  const [language, setLanguageState] = useState("browser");
  const [prefersDark, setPrefersDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    const storedLang = window.localStorage.getItem(LANGUAGE_KEY);
    if (storedMode === "browser" || storedMode === "light" || storedMode === "dark") {
      setVisualModeState(storedMode);
    }
    if (storedLang) setLanguageState(storedLang);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    setReady(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setVisualMode = useCallback((mode: VisualMode) => {
    setVisualModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const setLanguage = useCallback((next: string) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
  }, []);

  const resolvedTheme = resolveTheme(visualMode, prefersDark);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-console-theme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [ready, resolvedTheme]);

  const value = useMemo(
    () => ({
      visualMode,
      resolvedTheme,
      language,
      setVisualMode,
      setLanguage,
    }),
    [visualMode, resolvedTheme, language, setVisualMode, setLanguage],
  );

  return (
    <ConsoleThemeContext.Provider value={value}>{children}</ConsoleThemeContext.Provider>
  );
}

export function useConsoleTheme(): ConsoleThemeState {
  const ctx = useContext(ConsoleThemeContext);
  if (!ctx) {
    throw new Error("useConsoleTheme must be used within ConsoleThemeProvider");
  }
  return ctx;
}
