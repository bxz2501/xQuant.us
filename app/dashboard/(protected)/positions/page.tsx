"use client";

import { useEffect, useState } from "react";
import { TradesTable } from "@/components/dashboard/trades-table";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import type { TradeRowWithPnl } from "@/lib/perf";

export default function PositionsPage() {
  const { t } = useLocale();
  const [rows, setRows] = useState<TradeRowWithPnl[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/perf/positions")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRows(d.rows as TradeRowWithPnl[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("errors.loadFailed")));
  }, [t]);

  if (error) {
    return (
      <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }
  if (!rows) return <Spinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{t("positions.title")}</h2>
        <p className="text-sm text-text-secondary mt-1">{t("positions.subtitle")}</p>
      </div>
      <TradesTable trades={rows} showExit={false} />
    </div>
  );
}
