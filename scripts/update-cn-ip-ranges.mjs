// Regenerates lib/cn-ip-ranges.json from APNIC's delegation file.
// Usage: node scripts/update-cn-ip-ranges.mjs
import { writeFileSync } from "node:fs";

const SOURCE = "https://ftp.apnic.net/stats/apnic/delegated-apnic-latest";
const OUT = new URL("../lib/cn-ip-ranges.json", import.meta.url);

const text = await (await fetch(SOURCE)).text();

const v4 = [];
const v6 = [];
for (const line of text.split("\n")) {
  const [, cc, type, start, value, , status] = line.split("|");
  if (cc !== "CN" || (status !== "allocated" && status !== "assigned")) continue;
  if (type === "ipv4") {
    const n = start.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);
    v4.push([n, n + Number(value) - 1]);
  } else if (type === "ipv6") {
    v6.push(`${start}/${value}`);
  }
}

// Sort and merge adjacent IPv4 ranges so lookups can binary search.
v4.sort((a, b) => a[0] - b[0]);
const merged = [];
for (const r of v4) {
  const last = merged[merged.length - 1];
  if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
  else merged.push([...r]);
}

writeFileSync(OUT, JSON.stringify({ source: SOURCE, generatedAt: new Date().toISOString(), v4: merged, v6 }) + "\n");
console.log(`wrote ${merged.length} IPv4 ranges, ${v6.length} IPv6 prefixes`);
