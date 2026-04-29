"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const DEFAULT_THEME: Theme = "dark";
const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "xquant:theme-change";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: DEFAULT_THEME, toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function readTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : DEFAULT_THEME;
}

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function persistTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    persistTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
