"use client";

import { useEffect, useState } from "react";
import { PerfChart } from "@/components/dashboard/perf-chart";
import { PerfSummary } from "@/components/dashboard/perf-summary";
import { Spinner } from "@/components/ui/spinner";
import type { OutPerformRow } from "@/lib/perf";

export default function PerformancePage() {
  const [rows, setRows] = useState<OutPerformRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/perf/outperform")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRows(d.rows as OutPerformRow[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

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
        <h2 className="text-xl font-bold text-text-primary">Performance vs S&P 500</h2>
        <p className="text-sm text-text-secondary mt-1">
          Cumulative return since {rows[0]?.date} ({rows.length} trading days)
        </p>
      </div>
      <PerfSummary rows={rows} />
      <PerfChart data={rows} />
    </div>
  );
}
