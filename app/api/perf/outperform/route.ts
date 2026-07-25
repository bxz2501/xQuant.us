export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadOutPerform } from "@/lib/perf";

export async function GET(req: Request) {
  try {
    const market = new URL(req.url).searchParams.get("market") === "cn" ? "cn" : "us";
    const rows = await loadOutPerform(market);
    return NextResponse.json({ rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "load failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
