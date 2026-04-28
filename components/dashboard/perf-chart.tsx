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
  const tooltipRef = useRef<HTMLDivElement>(null);
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
      lastValueVisible: false,
      priceLineVisible: false,
    });
    const marketSeries = chart.addSeries(LineSeries, {
      color: isDark ? "#94a3b8" : "#64748b",
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const accountData = data.map((d) => ({ time: d.date as Time, value: d.accountReturn * 100 }));
    const marketData = data.map((d) => ({ time: d.date as Time, value: d.marketReturn * 100 }));
    const byDate = new Map(data.map((d) => [d.date, d]));

    accountSeries.setData(accountData);
    marketSeries.setData(marketData);
    chart.timeScale().fitContent();

    const tooltip = tooltipRef.current;

    const crosshairHandler = (param: Parameters<Parameters<typeof chart.subscribeCrosshairMove>[0]>[0]) => {
      if (!tooltip || !containerRef.current) return;
      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0 ||
        param.point.x > containerRef.current.clientWidth ||
        param.point.y > 420
      ) {
        tooltip.style.display = "none";
        return;
      }
      const dateKey = String(param.time);
      const row = byDate.get(dateKey);
      if (!row) {
        tooltip.style.display = "none";
        return;
      }
      tooltip.style.display = "block";
      tooltip.innerHTML = renderTooltip(row, isDark);

      const w = containerRef.current.clientWidth;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      let left = param.point.x + 16;
      if (left + tw > w) left = param.point.x - tw - 16;
      let top = param.point.y + 16;
      if (top + th > 420) top = param.point.y - th - 16;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.unsubscribeCrosshairMove(crosshairHandler);
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
      <div ref={containerRef} className="relative">
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-10 hidden rounded-lg border border-border-glass bg-bg-secondary/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
          style={{ display: "none" }}
        />
      </div>
    </Card>
  );
}

function renderTooltip(row: OutPerformRow, isDark: boolean): string {
  const accColor = isDark ? "#22c55e" : "#16a34a";
  const mktColor = isDark ? "#94a3b8" : "#64748b";
  const outColor = row.outPerform >= 0 ? (isDark ? "#22c55e" : "#16a34a") : (isDark ? "#ef4444" : "#dc2626");
  return `
    <div class="text-text-muted mb-1">${row.date}</div>
    <div class="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
      <span style="color:${accColor}">Account</span><span class="text-right font-mono">${pct(row.accountReturn)}</span>
      <span style="color:${mktColor}">S&amp;P 500</span><span class="text-right font-mono">${pct(row.marketReturn)}</span>
      <span class="text-text-secondary">Outperform</span><span class="text-right font-mono" style="color:${outColor}">${pct(row.outPerform)}</span>
    </div>
  `;
}

function pct(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(2)}%`;
}
