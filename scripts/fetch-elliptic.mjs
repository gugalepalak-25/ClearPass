// Downloads Elliptic's free Binance-hack blocklist into data/blocklist.elliptic.json.
// Run from the project root:  node scripts/fetch-elliptic.mjs
// Source: https://www.elliptic.co/binance-hack-2026-blocklist/  (one address per line, no header)
// Elliptic updates it as it finds new wallets; re-run regularly (hourly is their suggestion).
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'https://data-cdn.elliptic.co/blocklists/binance-hack-blocklist.csv';
const out = process.argv[2] || 'data/blocklist.elliptic.json';
const norm = (a) => (/^0x[0-9a-fA-F]{40}$/.test(a) ? a.toLowerCase() : a);
const chainOf = (a) =>
  /^0x[0-9a-fA-F]{40}$/.test(a) ? 'evm'
  : /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a) ? 'tron'
  : /^(bc1[a-z0-9]{20,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(a) ? 'bitcoin'
  : /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a) ? 'xrp'
  : /^[0-9a-f]{64}$/.test(a) ? 'near-implicit'
  : /^[a-z0-9._-]+\.(near|tg)$/.test(a) ? 'near'
  : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) ? 'solana' : 'unknown';

const res = await fetch(URL);
if (!res.ok) { console.error(`Download failed: HTTP ${res.status}`); process.exit(1); }
const seen = new Map();
for (const line of (await res.text()).split(/\r?\n/)) {
  const address = line.trim().replace(/^"|"$/g, '');
  if (address && !seen.has(norm(address))) seen.set(norm(address), { address, chain: chainOf(address), source: 'elliptic', reason: "On Elliptic's Binance hack (Oct 2026) blocklist" });
}
const d = new Date(), p = (n) => String(n).padStart(2, '0');
const version = Number(`${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}`);
const entries = [...seen.values()];
mkdirSync('data', { recursive: true });
writeFileSync(out, JSON.stringify({ version, name: 'elliptic-binance-hack-2026', updatedAt: d.toISOString(), source: URL, entries }, null, 2));
console.log(`Saved ${entries.length} addresses to ${out} (version ${version})`);
console.log('By chain:', entries.reduce((m, e) => ((m[e.chain] = (m[e.chain] || 0) + 1), m), {}));
