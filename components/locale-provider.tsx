"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

export type Locale = "en" | "zh";
const DEFAULT_LOCALE: Locale = "en";
const LOCALE_STORAGE_KEY = "locale";
const LOCALE_CHANGE_EVENT = "xquant:locale-change";

const dict: Record<Locale, typeof en> = { en, zh };

type Vars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: string, vars?: Vars) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
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

function syncFavicon(locale: Locale) {
  const variants: { rel: string; href: string }[] =
    locale === "zh"
      ? [
          { rel: "icon", href: "/favicon-zh.ico" },
          { rel: "icon", href: "/icon-zh.png" },
          { rel: "apple-touch-icon", href: "/apple-icon-zh.png" },
        ]
      : [
          { rel: "icon", href: "/favicon.ico" },
        ];

  document
    .querySelectorAll<HTMLLinkElement>('link[data-locale-managed]')
    .forEach((el) => el.remove());
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => el.remove());

  for (const v of variants) {
    const link = document.createElement("link");
    link.rel = v.rel;
    link.href = v.href;
    link.setAttribute("data-locale-managed", "");
    document.head.appendChild(link);
  }
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === "en" || saved === "zh" ? saved : DEFAULT_LOCALE;
}

function subscribeLocale(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

function persistLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.setAttribute("data-locale", locale);
  syncFavicon(locale);
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => DEFAULT_LOCALE);

  useEffect(() => {
    document.documentElement.setAttribute("data-locale", locale);
    syncFavicon(locale);
  }, [locale]);

  const toggleLocale = useCallback(() => {
    persistLocale(readLocale() === "en" ? "zh" : "en");
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => interpolate(lookup(dict[locale], key), vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, toggleLocale, t }), [locale, toggleLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
