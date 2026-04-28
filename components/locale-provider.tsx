"use client";

import { createContext, useContext, useEffect, useState } from "react";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

export type Locale = "en" | "zh";

const dict: Record<Locale, typeof en> = { en, zh };

type Vars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: string, vars?: Vars) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  toggleLocale: () => {},
  t: (k) => k,
});

export function useLocale() {
  return useContext(LocaleContext);
}

function lookup(obj: unknown, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "en" || saved === "zh") setLocale(saved);
  }, []);

  function toggleLocale() {
    const next: Locale = locale === "en" ? "zh" : "en";
    setLocale(next);
    localStorage.setItem("locale", next);
  }

  const t = (key: string, vars?: Vars) => interpolate(lookup(dict[locale], key), vars);

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
