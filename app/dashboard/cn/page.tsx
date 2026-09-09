import { PerfPage } from "@/components/dashboard/perf-page";

export default function ChinaPerformancePage() {
  return (
    <PerfPage
      market="cn"
      ns="perfCn"
      currency="CNY"
      ranges={["ytd", "1y", "all"]}
      startDate="2026-06-30"
    />
  );
}
