"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import type { Meta } from "@/lib/perf";

const NAV = [
  { href: "/dashboard", label: "Performance", protected: false },
  { href: "/dashboard/positions", label: "Positions", protected: true },
  { href: "/dashboard/trades", label: "Trades", protected: true },
];

export function DashboardShell({
  userName,
  meta,
  children,
}: {
  userName: string | null;
  meta: Meta;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-bg-secondary border-r border-border-glass flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border-glass">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-text-primary">xQuant</h1>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-bg-card transition-colors cursor-pointer text-text-muted hover:text-text-primary"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            {userName ? (
              <>
                <span className="text-sm text-text-secondary truncate">{userName}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/dashboard" })}
                  className="text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-text-muted">Guest</span>
                <Link
                  href="/login"
                  className="text-xs text-accent hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const locked = item.protected && !userName;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={locked ? "Sign in to view" : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                }`}
              >
                <span>{item.label}</span>
                {locked && (
                  <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.1-.9-2-2-2s-2 .9-2 2v3h4v-3zM6 11V7a4 4 0 118 0v4M5 11h10v9H5v-9z" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-border-glass text-xs text-text-muted">
          <div>Account</div>
          <div className="text-text-secondary truncate">{meta.account || "—"}</div>
          <div className="mt-2">Last updated</div>
          <div className="text-text-secondary">{formatStamp(meta.generatedAt)}</div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border-glass">
          <button
            onClick={() => setOpen(true)}
            className="text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">xQuant</h1>
          <div className="w-6" />
        </div>

        <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function formatStamp(s: string | null): string {
  if (!s) return "never";
  try {
    return new Date(s).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}
