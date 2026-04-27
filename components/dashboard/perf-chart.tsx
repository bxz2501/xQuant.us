"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries, type Time } from "lightweight-charts";
import { useTheme } from "@/components/theme-provider";
import { Card } from "@/components/ui/card";
import type { OutPerformRow } from "@/lib/perf";

interface Props {
  data: OutPerformRow[];
}

export function PerfChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const isDark = theme === "dark";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.15)";
    const borderColor = isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.25)";

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 420,
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: false },
      crosshair: {
        vertLine: { color: "rgba(148, 163, 184, 0.3)" },
        horzLine: { color: "rgba(148, 163, 184, 0.3)" },
      },
    });

    const accountSeries = chart.addSeries(LineSeries, {
      color: isDark ? "#22c55e" : "#16a34a",
      lineWidth: 2,
      title: "Account",
    });
    const marketSeries = chart.addSeries(LineSeries, {
      color: isDark ? "#94a3b8" : "#64748b",
      lineWidth: 2,
      title: "S&P 500",
    });

    const accountData = data.map((d) => ({
      time: d.date as Time,
      value: d.accountReturn * 100,
    }));
    const marketData = data.map((d) => ({
      time: d.date as Time,
      value: d.marketReturn * 100,
    }));

    accountSeries.setData(accountData);
    marketSeries.setData(marketData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, theme]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-secondary">Cumulative Return (%)</h3>
        <div className="flex gap-3 text-xs text-text-muted">
          <span><span className="inline-block w-3 h-0.5 bg-success align-middle mr-1" />Account</span>
          <span><span className="inline-block w-3 h-0.5 bg-text-secondary align-middle mr-1" />S&P 500</span>
        </div>
      </div>
      <div ref={containerRef} />
    </Card>
  );
}
