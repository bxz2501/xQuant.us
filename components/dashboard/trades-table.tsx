"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import type { TradeRowWithPnl } from "@/lib/perf";

interface Props {
  trades: TradeRowWithPnl[];
  showExit?: boolean;
}

type SortKey = "enterTime" | "exitTime" | "symbol1" | "pnl";

export function TradesTable({ trades, showExit = true }: Props) {
  const { locale, t } = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("enterTime");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    const f = filter.trim().toUpperCase();
    let arr = trades;
    if (f) {
      arr = arr.filter((t) => t.symbol1.toUpperCase().includes(f));
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...arr].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [trades, sortKey, sortDir, filter]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-text-muted text-center">{t("trades.noTrades")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-sm font-semibold text-text-secondary">
          {showExit ? t("trades.title") : t("trades.openPositions")} ({sorted.length})
        </h3>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("trades.filterPlaceholder")}
          className="rounded-lg border border-border-glass bg-bg-secondary px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-secondary">
            <tr className="border-b border-border-glass text-text-muted text-xs">
              <Th onClick={() => toggleSort("symbol1")} active={sortKey === "symbol1"} dir={sortDir}>{t("trades.symbol")}</Th>
              <th className="text-right py-2 px-2">{t("trades.shares")}</th>
              <th className="text-right py-2 px-2">{t("trades.enter")}</th>
              {showExit ? (
                <th className="text-right py-2 px-2">{t("trades.exit")}</th>
              ) : (
                <th className="text-right py-2 px-2">{t("trades.current")}</th>
              )}
              <Th onClick={() => toggleSort("pnl")} active={sortKey === "pnl"} dir={sortDir} align="right">
                {t("trades.pnl")}
              </Th>
              <Th onClick={() => toggleSort("enterTime")} active={sortKey === "enterTime"} dir={sortDir}>{t("trades.enterTime")}</Th>
              {showExit && <Th onClick={() => toggleSort("exitTime")} active={sortKey === "exitTime"} dir={sortDir}>{t("trades.exitTime")}</Th>}
              <th className="text-right py-2 px-2">{t("trades.days")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const days = daysBetween(row.enterTime, showExit ? row.exitTime : new Date().toISOString());
              return (
                <tr key={row.id} className="border-b border-border-glass/50 hover:bg-white/[0.02]">
                  <td className="py-1.5 px-2 text-text-primary">{row.symbol1}</td>
                  <td className="py-1.5 px-2 text-right text-text-secondary">{fmtNum(row.share1)}</td>
                  <td className="py-1.5 px-2 text-right text-text-secondary">{fmtPrice(row.enterPrice1)}</td>
                  {showExit ? (
                    <td className="py-1.5 px-2 text-right text-text-secondary">{fmtPrice(row.exitPrice1)}</td>
                  ) : (
                    <td className="py-1.5 px-2 text-right text-text-secondary">{fmtPrice(row.currentPrice)}</td>
                  )}
                  <td className={`py-1.5 px-2 text-right font-mono ${pnlColor(row.pnl)}`}>{fmtPnl(row.pnl)}</td>
                  <td className="py-1.5 px-2 text-text-secondary text-xs">{fmtTime(row.enterTime, locale)}</td>
                  {showExit && <td className="py-1.5 px-2 text-text-secondary text-xs">{fmtTime(row.exitTime, locale)}</td>}
                  <td className="py-1.5 px-2 text-right text-text-secondary">{days ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
  align,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
  align?: "right";
}) {
  return (
    <th
      onClick={onClick}
      className={`py-2 px-2 cursor-pointer select-none ${align === "right" ? "text-right" : "text-left"} ${
        active ? "text-text-primary" : "text-text-muted"
      } hover:text-text-primary`}
    >
      {children}
      {active && <span className="ml-1">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

function fmtPnl(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const abs = Math.abs(v);
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlColor(v: number | null): string {
  if (v == null || !Number.isFinite(v) || v === 0) return "text-text-secondary";
  return v > 0 ? "text-success" : "text-danger";
}

function fmtPrice(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(2);
}

function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
}

function fmtTime(s: string | null, locale: string): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  try {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(0, Math.round(ms / 86400000));
  } catch {
    return null;
  }
}
