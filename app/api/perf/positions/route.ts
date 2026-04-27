export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadTrades } from "@/lib/perf";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const all = await loadTrades();
    const rows = all.filter((t) => t.active);
    return NextResponse.json({ rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "load failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
