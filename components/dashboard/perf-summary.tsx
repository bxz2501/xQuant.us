"use client";

import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
import type { OutPerformRow } from "@/lib/perf";

export function PerfSummary({ rows }: { rows: OutPerformRow[] }) {
  const { t } = useLocale();
  if (rows.length === 0) return null;
  const latest = rows[rows.length - 1];

  const items: { label: string; value: string; color: string }[] = [
    {
      label: t("perf.accountBalance"),
      value: usd(latest.rawBalance),
      color: "text-text-primary",
    },
    {
      label: t("perf.accountReturn"),
      value: pct(latest.accountReturn),
      color: latest.accountReturn >= 0 ? "text-success" : "text-danger",
    },
    {
      label: t("perf.marketReturn"),
      value: pct(latest.marketReturn),
      color: latest.marketReturn >= 0 ? "text-success" : "text-danger",
    },
    {
      label: t("perf.outperformance"),
      value: pct(latest.outPerform),
      color: latest.outPerform >= 0 ? "text-success" : "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label} className="p-3 text-center">
          <div className="text-xs text-text-muted mb-1">{it.label}</div>
          <div className={`text-lg font-semibold ${it.color}`}>{it.value}</div>
        </Card>
      ))}
    </div>
  );
}

function pct(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(2)}%`;
}

function usd(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
