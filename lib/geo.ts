import ranges from "./cn-ip-ranges.json";

// Mainland China IP allocations from APNIC; refresh with scripts/update-cn-ip-ranges.mjs.
const V4 = ranges.v4 as [number, number][];

const V6: [bigint, bigint][] = ranges.v6
  .map((cidr): [bigint, bigint] | null => {
    const [addr, len] = cidr.split("/");
    const start = parseIPv6(addr);
    if (start === null) return null;
    const hostBits = BigInt(128 - Number(len));
    return [start, start + (BigInt(1) << hostBits) - BigInt(1)];
  })
  .filter((r): r is [bigint, bigint] => r !== null)
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

function parseIPv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = n * 256 + Number(p);
  }
  return n;
}

function parseIPv6(ip: string): bigint | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null;
  const groups = [...head, ...Array(missing).fill("0"), ...tail];
  let n = BigInt(0);
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
    n = (n << BigInt(16)) | BigInt(parseInt(g, 16));
  }
  return n;
}

function inRanges<T extends number | bigint>(list: [T, T][], n: T): boolean {
  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (n < list[mid][0]) hi = mid - 1;
    else if (n > list[mid][1]) lo = mid + 1;
    else return true;
  }
  return false;
}

export function isChinaIP(ip: string): boolean {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const v4 = parseIPv4(mapped ? mapped[1] : ip);
  if (v4 !== null) return inRanges(V4, v4);
  const v6 = parseIPv6(ip);
  return v6 !== null && inRanges(V6, v6);
}

// nginx terminates TLS and proxies to Next, so the client IP comes from forwarding headers.
export function clientIP(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}
