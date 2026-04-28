export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attachPnl, loadLatestQuotes, loadTrades } from "@/lib/perf";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [all, quotes] = await Promise.all([loadTrades(), loadLatestQuotes()]);
    const rows = all.filter((t) => !t.active && t.exitTime).map((t) => attachPnl(t, quotes));
    return NextResponse.json({ rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "load failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
