import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.PERF_DATA_DIR || "/var/lib/perf-site/data";

export type OutPerformRow = {
  date: string;
  rawBalance: number;
  adjustedBalance: number;
  baseBalance: number;
  accountReturn: number;
  marketReturn: number;
  outPerform: number;
};

export type TradeRow = {
  id: number;
  accountName: string;
  securityType1: string;
  securityType2: string;
  exchange1: string;
  exchange2: string;
  symbol1: string;
  symbol2: string;
  position: number;
  share1: number;
  share2: number;
  enterPrice1: number | null;
  enterPrice2: number | null;
  exitPrice1: number | null;
  exitPrice2: number | null;
  enterTime: string | null;
  exitTime: string | null;
  active: boolean;
  createdOn: string;
  modifiedOn: string;
};

export type Meta = { generatedAt: string | null; account: string | null };

export type LatestQuote = { symbol: string; exchange: string; close: number | null; time: string | null };

export type TradeRowWithPnl = TradeRow & {
  currentPrice: number | null;
  pnl: number | null;
};

/**
 * Minimal CSV parser. Handles RFC4180 quoting: quoted fields, escaped quotes ("").
 * Newlines inside quoted fields are supported.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip; \n handles the row break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

async function readCsv(name: string): Promise<{ headers: string[]; rows: string[][] }> {
  const text = await fs.readFile(path.join(DATA_DIR, name), "utf8");
  const all = parseCsv(text);
  if (all.length === 0) return { headers: [], rows: [] };
  const [headers, ...rows] = all;
  return { headers, rows };
}

function num(v: string): number {
  if (v === "" || v == null) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function nullableNum(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function nullableStr(v: string): string | null {
  return v === "" ? null : v;
}

function bool(v: string): boolean {
  return v === "True" || v === "true" || v === "1";
}

export async function loadOutPerform(): Promise<OutPerformRow[]> {
  const { headers, rows } = await readCsv("outperform.csv");
  const idx = (k: string) => headers.indexOf(k);
  const i = {
    date: idx("Date"),
    rawBalance: idx("RawBalance"),
    adjustedBalance: idx("AdjustedBalance"),
    baseBalance: idx("BaseBalance"),
    accountReturn: idx("AccountReturn"),
    marketReturn: idx("MarketReturn"),
    outPerform: idx("OutPerform"),
  };
  return rows
    .map((r) => ({
      date: r[i.date],
      rawBalance: num(r[i.rawBalance]),
      adjustedBalance: num(r[i.adjustedBalance]),
      baseBalance: num(r[i.baseBalance]),
      accountReturn: num(r[i.accountReturn]),
      marketReturn: num(r[i.marketReturn]),
      outPerform: num(r[i.outPerform]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadTrades(): Promise<TradeRow[]> {
  const { headers, rows } = await readCsv("arbitrage_trades.csv");
  const idx = (k: string) => headers.indexOf(k);
  const i = {
    id: idx("Id"),
    accountName: idx("AccountName"),
    securityType1: idx("SecurityType1"),
    securityType2: idx("SecurityType2"),
    exchange1: idx("Exchange1"),
    exchange2: idx("Exchange2"),
    symbol1: idx("Symbol1"),
    symbol2: idx("Symbol2"),
    position: idx("Position"),
    share1: idx("Share1"),
    share2: idx("Share2"),
    enterPrice1: idx("EnterPrice1"),
    enterPrice2: idx("EnterPrice2"),
    exitPrice1: idx("ExitPrice1"),
    exitPrice2: idx("ExitPrice2"),
    enterTime: idx("EnterTime"),
    exitTime: idx("ExitTime"),
    active: idx("Active"),
    createdOn: idx("CreatedOn"),
    modifiedOn: idx("ModifiedOn"),
  };
  return rows.map((r) => ({
    id: Number(r[i.id]),
    accountName: r[i.accountName],
    securityType1: r[i.securityType1],
    securityType2: r[i.securityType2],
    exchange1: r[i.exchange1],
    exchange2: r[i.exchange2],
    symbol1: r[i.symbol1],
    symbol2: r[i.symbol2],
    position: Number(r[i.position]),
    share1: num(r[i.share1]),
    share2: num(r[i.share2]),
    enterPrice1: nullableNum(r[i.enterPrice1]),
    enterPrice2: nullableNum(r[i.enterPrice2]),
    exitPrice1: nullableNum(r[i.exitPrice1]),
    exitPrice2: nullableNum(r[i.exitPrice2]),
    enterTime: nullableStr(r[i.enterTime]),
    exitTime: nullableStr(r[i.exitTime]),
    active: bool(r[i.active]),
    createdOn: r[i.createdOn],
    modifiedOn: r[i.modifiedOn],
  }));
}

export async function loadLatestQuotes(): Promise<Map<string, LatestQuote>> {
  try {
    const { headers, rows } = await readCsv("latest_quotes.csv");
    const idx = (k: string) => headers.indexOf(k);
    const i = {
      symbol: idx("Symbol"),
      exchange: idx("Exchange"),
      close: idx("LatestClose"),
      time: idx("QuoteTime"),
    };
    const map = new Map<string, LatestQuote>();
    for (const r of rows) {
      const symbol = r[i.symbol];
      if (!symbol) continue;
      map.set(symbol, {
        symbol,
        exchange: r[i.exchange],
        close: nullableNum(r[i.close]),
        time: nullableStr(r[i.time]),
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export function attachPnl(trade: TradeRow, quotes: Map<string, LatestQuote>): TradeRowWithPnl {
  if (trade.active) {
    const current = quotes.get(trade.symbol1)?.close ?? null;
    const pnl =
      current != null && trade.enterPrice1 != null
        ? (current - trade.enterPrice1) * trade.share1
        : null;
    return { ...trade, currentPrice: current, pnl };
  }
  const pnl =
    trade.exitPrice1 != null && trade.enterPrice1 != null
      ? (trade.exitPrice1 - trade.enterPrice1) * trade.share1
      : null;
  return { ...trade, currentPrice: null, pnl };
}

export async function loadMeta(): Promise<Meta> {
  try {
    const { rows } = await readCsv("meta.csv");
    const map = new Map<string, string>();
    for (const r of rows) map.set(r[0], r[1]);
    return {
      generatedAt: map.get("generated_at") || null,
      account: map.get("account") || null,
    };
  } catch {
    return { generatedAt: null, account: null };
  }
}
