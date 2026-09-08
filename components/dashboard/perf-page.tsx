"use client";

import { useEffect, useMemo, useState } from "react";
import { PerfChart } from "@/components/dashboard/perf-chart";
import { PerfSummary } from "@/components/dashboard/perf-summary";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import type { Market, OutPerformRow } from "@/lib/perf";

export type Range = "ytd" | "1y" | "2025" | "all";

export function PerfPage({
  market = "us",
  ns = "perf",
  currency = "USD",
  ranges = ["ytd", "1y", "2025", "all"],
  startDate,
}: {
  market?: Market;
  ns?: string;
  currency?: string;
  ranges?: Range[];
  /** Drop rows before this date and treat it as the zero-return baseline. */
  startDate?: string;
}) {
  const { t } = useLocale();
  const [rows, setRows] = useState<OutPerformRow[] | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState<Range>(ranges[0]);

  useEffect(() => {
    fetch(`/api/perf/outperform?market=${market}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRows(d.rows as OutPerformRow[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("errors.loadFailed")));
  }, [market, t]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const based = startDate ? rebaseFrom(rows, startDate) : rows;
    return filterAndRebase(based, range);
  }, [rows, range, startDate]);

  if (error) {
    return (
      <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }
  if (!rows || !filtered) return <Spinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{t(`${ns}.title`)}</h2>
        <p className="text-xs text-text-secondary/70 mt-1">
          {t(`${ns}.marketSource`)}
        </p>
        <p className="text-sm text-text-secondary mt-0.5">
          {t(`${ns}.subtitle`, { date: filtered[0]?.date ?? "—", days: filtered.length })}
        </p>
      </div>
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border-glass bg-bg-secondary/40 p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                range === r
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t(`perf.range.${r}`)}
            </button>
          ))}
        </div>
      </div>
      <PerfSummary rows={filtered} ns={ns} currency={currency} />
      <PerfChart data={filtered} ns={ns} />
    </div>
  );
}

function filterAndRebase(rows: OutPerformRow[], range: Range): OutPerformRow[] {
  if (rows.length === 0 || range === "all") return rows;

  const latest = rows[rows.length - 1].date;
  let anchorDate: string;
  let endDate: string | null = null;
  if (range === "ytd") {
    anchorDate = `${Number(latest.slice(0, 4)) - 1}-12-31`;
  } else if (range === "2025") {
    anchorDate = "2024-12-31";
    endDate = "2025-12-31";
  } else {
    const d = new Date(`${latest}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    anchorDate = d.toISOString().slice(0, 10);
  }

  let anchorIdx = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].date <= anchorDate) {
      anchorIdx = i;
      break;
    }
  }
  let sliced = anchorIdx >= 0 ? rows.slice(anchorIdx) : rows;
  if (endDate) sliced = sliced.filter((r) => r.date <= endDate);
  if (sliced.length === 0) return rows;

  return rebase(sliced);
}

function rebaseFrom(rows: OutPerformRow[], startDate: string): OutPerformRow[] {
  let anchorIdx = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].date <= startDate) {
      anchorIdx = i;
      break;
    }
  }
  if (anchorIdx < 0) return rows;
  return rebase(rows.slice(anchorIdx));
}

function rebase(sliced: OutPerformRow[]): OutPerformRow[] {
  const baseAcct = 1 + sliced[0].accountReturn;
  const baseMkt = 1 + sliced[0].marketReturn;
  return sliced.map((r) => {
    const accountReturn = (1 + r.accountReturn) / baseAcct - 1;
    const marketReturn = (1 + r.marketReturn) / baseMkt - 1;
    return {
      ...r,
      accountReturn,
      marketReturn,
      outPerform: accountReturn - marketReturn,
    };
  });
}
