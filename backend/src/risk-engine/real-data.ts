/**
 * ClearPass real-data module.
 *
 * 1. Elliptic's free Binance-hack blocklist (24k+ addresses across Tron, EVM, Bitcoin, Solana, XRP and NEAR).
 *    File produced by `node scripts/fetch-elliptic.js` -> data/blocklist.elliptic.json
 *    Source: https://www.elliptic.co/binance-hack-2026-blocklist/
 * 2. Watch-listed tokens: data/watch-tokens.json (tokens whose launch matches Elliptic's description of the
 *    Nov 2026 NEAR memecoin laundering). A match on public facts, NOT a confirmed attribution.
 * 3. Real NEAR transfer history from the NearBlocks API (NEAR RPC cannot list an account's past transactions).
 *    Traces INCOMING money backwards up to `hopDepth` steps, only counting money received before it moved on.
 *
 * Environment (all optional):
 *   SCAN_NETWORK=mainnet|testnet   where wallet history is read from (default: mainnet; real activity lives there)
 *   SCAN_RPC_URL                   RPC for the scan network (default: FastNEAR public RPC for mainnet)
 *   NEARBLOCKS_API_KEY             raises NearBlocks rate limits
 *   SCAN_FANOUT=5                  max senders followed per step beyond hop 1 (keeps scans fast)
 *   ELLIPTIC_BLOCKLIST_PATH, WATCH_TOKENS_PATH  override file locations
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import type { FlaggedEntity, NormalizedTransaction } from '../types/index.js';

const dataDir = path.dirname(config.riskListPath);

export const scanNetwork = (process.env.SCAN_NETWORK || 'mainnet').toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
export const scanRpcUrl =
  process.env.SCAN_RPC_URL ||
  (scanNetwork === config.nearNetwork ? config.nearRpcUrl : 'https://rpc.mainnet.fastnear.com');

// ---------------------------------------------------------------- blocklist

interface BlocklistEntry { address: string; chain?: string; reason?: string; source?: string }
interface Blocklist { version: number | string; name: string; size: number; lookup: (a: string) => BlocklistEntry | undefined }

/** Elliptic: compare 0x addresses in lowercase, everything else exactly as written. */
export function normalizeAddress(a: string): string {
  const s = String(a).trim();
  return /^0x[0-9a-fA-F]{40}$/.test(s) ? s.toLowerCase() : s;
}

let blocklist: Blocklist | null | undefined;
export function loadEllipticBlocklist(): Blocklist | null {
  if (blocklist !== undefined) return blocklist;
  const file = process.env.ELLIPTIC_BLOCKLIST_PATH || path.join(dataDir, 'blocklist.elliptic.json');
  try {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const map = new Map<string, BlocklistEntry>();
    for (const e of json.entries || []) map.set(normalizeAddress(e.address), e);
    blocklist = { version: json.version, name: json.name, size: map.size, lookup: (a) => map.get(normalizeAddress(a)) };
    console.log(`[RealData] Loaded ${map.size} addresses from ${json.name} v${json.version}`);
  } catch {
    console.warn(`[RealData] No Elliptic blocklist at ${file} (run scripts/fetch-elliptic.js). Using demo list only.`);
    blocklist = null;
  }
  return blocklist;
}

/** Returns a FlaggedEntity for an address on Elliptic's list, shaped like the demo entities. */
export function ellipticEntity(address: string): FlaggedEntity | undefined {
  const bl = loadEllipticBlocklist();
  const hit = bl?.lookup(address);
  if (!hit) return undefined;
  return {
    address: hit.address,
    // Add 'theft' to the FlaggedEntity category type and the categories map (see SETUP notes).
    category: 'theft' as unknown as FlaggedEntity['category'],
    severity: 'CRITICAL',
    label: "Elliptic Binance-hack blocklist",
    riskScore: 95,
    flaggedSince: '2026-10-29T00:00:00Z',
    notes: `${hit.reason || "On Elliptic's public Binance hack (Oct 2026) blocklist"}. Source: https://www.elliptic.co/binance-hack-2026-blocklist/`,
  };
}

// ---------------------------------------------------------------- watch-listed tokens

export interface WatchToken { contract: string; symbol: string; created?: string }
let watch: Map<string, WatchToken> | undefined;
export function watchToken(contract?: string): WatchToken | undefined {
  if (!contract) return undefined;
  if (!watch) {
    watch = new Map();
    const file = process.env.WATCH_TOKENS_PATH || path.join(dataDir, 'watch-tokens.json');
    try {
      for (const t of JSON.parse(fs.readFileSync(file, 'utf8')).tokens || []) watch.set(t.contract, t);
    } catch { /* no watch list */ }
  }
  return watch.get(contract);
}

// ---------------------------------------------------------------- NearBlocks history

interface Transfer { from: string; to: string; amount: number; asset: string; tokenContract?: string; atMs: number; txHash: string }

const NB_BASE = scanNetwork === 'testnet' ? 'https://api-testnet.nearblocks.io/v1' : 'https://api.nearblocks.io/v1';
const cache = new Map<string, unknown>();
let requestCount = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nbGet(urlPath: string): Promise<any> {
  const url = NB_BASE + urlPath;
  if (cache.has(url)) return cache.get(url);
  const headers: Record<string, string> = process.env.NEARBLOCKS_API_KEY ? { Authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {};
  for (let attempt = 0; attempt < 4; attempt++) {
    requestCount++;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (res.status === 429) { await sleep(2000 * 2 ** attempt); continue; } // free tier rate limit
    if (!res.ok) throw new Error(`NearBlocks HTTP ${res.status}`);
    const json = await res.json();
    cache.set(url, json);
    return json;
  }
  throw new Error('NearBlocks rate limit: try again in a minute or set NEARBLOCKS_API_KEY');
}

const nsToMs = (ns: unknown): number => {
  try { return Number(BigInt(String(ns)) / 1_000_000n); } catch { return Date.parse(String(ns)) || 0; }
};
const yoctoToNear = (v: unknown): number => {
  if (typeof v === 'number') return v / 1e24;
  try { return Number(BigInt(String(v ?? '0').split('.')[0]) / 10n ** 18n) / 1e6; } catch { return 0; }
};

/** Money that came INTO `account` (native NEAR + NEP-141 tokens), newest first, one page each. */
async function incoming(account: string): Promise<Transfer[]> {
  const out: Transfer[] = [];
  const id = encodeURIComponent(account);
  const t = await nbGet(`/account/${id}/txns?page=1&per_page=25&order=desc`);
  for (const x of t.txns || []) {
    if (x.receiver_account_id !== account) continue;
    const deposit = x.actions_agg?.deposit ?? (x.actions || []).reduce((s: number, a: any) => s + Number(a.deposit || 0), 0);
    const amount = yoctoToNear(deposit);
    if (!(amount > 0)) continue;
    out.push({ from: x.predecessor_account_id || x.signer_account_id, to: account, amount, asset: 'NEAR',
               atMs: nsToMs(x.block_timestamp), txHash: x.transaction_hash });
  }
  try {
    const f = await nbGet(`/account/${id}/ft-txns?page=1&per_page=25&order=desc`);
    for (const x of f.txns || []) {
      const delta = Number(x.delta_amount || 0);
      if (!(delta > 0) || !x.involved_account_id) continue;
      out.push({ from: x.involved_account_id, to: account, amount: delta / 10 ** Number(x.ft?.decimals ?? 0),
                 asset: x.ft?.symbol || 'FT', tokenContract: x.ft?.contract, atMs: nsToMs(x.block_timestamp), txHash: x.transaction_hash });
    }
  } catch { /* token history unavailable: native NEAR still counts */ }
  return out;
}

export interface HistoryResult {
  transactions: NormalizedTransaction[];
  completeness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  note: string;
}

export async function fetchNearBlocksHistory(account: string, hopDepth: number): Promise<HistoryResult> {
  const fanout = Math.max(1, Number(process.env.SCAN_FANOUT || 5));
  const startRequests = requestCount;
  const txs: NormalizedTransaction[] = [];
  const toTx = (t: Transfer, hop: number, via?: string) => ({
    counterparty: t.from, hop, direction: 'IN', amountNear: Math.round(t.amount * 1e6) / 1e6, token: t.asset,
    flagged: false, txHash: t.txHash, timestamp: new Date(t.atMs).toISOString(),
    via, tokenContract: t.tokenContract,
  }) as unknown as NormalizedTransaction;

  let level: Transfer[];
  try {
    level = await incoming(account);
  } catch (e: any) {
    return { transactions: [], completeness: 'INSUFFICIENT', note: `Could not read history from NearBlocks: ${e.message}` };
  }
  if (level.length === 0) {
    return { transactions: [], completeness: 'INSUFFICIENT',
             note: `No incoming transfers found for ${account} on NEAR ${scanNetwork}, so the source of its funds can't be established.` };
  }
  level.forEach((t) => txs.push(toTx(t, 1)));

  let partial = false;
  const visited = new Set<string>([account]);
  for (let hop = 2; hop <= hopDepth; hop++) {
    // Follow the largest senders first; skip anyone already known to be flagged.
    const senders = [...level]
      .filter((t) => !visited.has(t.from) && !ellipticEntity(t.from))
      .sort((a, b) => b.amount - a.amount)
      .filter((t, i, arr) => arr.findIndex((u) => u.from === t.from) === i)
      .slice(0, fanout);
    if (level.length > senders.length) partial = true;
    const next: Transfer[] = [];
    for (const s of senders) {
      visited.add(s.from);
      try {
        // Only money the sender received BEFORE it paid onward can be the source.
        for (const t of (await incoming(s.from)).filter((u) => u.atMs < s.atMs)) {
          txs.push(toTx(t, hop, s.from));
          next.push(t);
        }
      } catch { partial = true; }
    }
    level = next;
    if (!level.length) break;
  }
  const used = requestCount - startRequests;
  return {
    transactions: txs,
    completeness: partial ? 'PARTIAL' : 'COMPLETE',
    note: `Traced ${txs.length} incoming transfers up to ${hopDepth} hops via NearBlocks (NEAR ${scanNetwork}, latest 25 per account, top ${fanout} senders per step, ${used} API calls).`,
  };
}
