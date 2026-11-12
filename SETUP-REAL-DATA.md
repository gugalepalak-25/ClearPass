# Real data for ClearPass (patch for the React/Fastify version)

## What this patch fixes

1. **Real wallets were auto-approved.** The live path never loaded any transactions (`liveTxs` was always
   empty) and returned `PARTIAL`, so every real account came back **APPROVED (4/100)** without being checked.
   Now history comes from NearBlocks, and a wallet with no readable history is **INCONCLUSIVE**, never approved.
2. **Real blocklist.** Elliptic's free Binance-hack blocklist (24k+ addresses) is checked alongside the demo list.
   0x addresses match in lowercase; Bitcoin, Tron, Solana and XRP match exactly, as Elliptic instructs.
3. **Watch-listed tokens.** Receiving one of the six tokens matching Elliptic's report on the Nov 2026 NEAR
   memecoin laundering gives **INCONCLUSIVE (needs review)**, not approval and not rejection.
4. **Direct blocklist match always rejects,** even if the wallet's history can't be read (before, it became inconclusive).
5. **Multi-hop graph edges** now run through the account the money passed through, instead of all pointing at the target.
6. **Risk list version** in results and certificates names both lists, e.g. `2026.11-demo-v1+elliptic-26111120`.

Demo scenarios work exactly as before.

## Files

| File in this zip | Put it at |
|---|---|
| `backend/src/risk-engine/real-data.ts` | same path (new file) |
| `backend/src/risk-engine/near-rpc.ts` | replace the existing file |
| `backend/src/risk-engine/flagged-data.ts` | replace the existing file |
| `backend/src/risk-engine/assessWalletRisk.PASTE-INTO-YOUR-FILE.ts` | copy its contents over the file that contains `assessWalletRisk`, then delete this one |
| `scripts/fetch-elliptic.mjs` | project root `scripts/` |
| `data/watch-tokens.json` | project root `data/` (next to `flagged-addresses.demo.json`) |

## Two small edits by hand

1. **Types** (`backend/src/types/index.ts`): add `'theft'` to the `FlaggedEntity` category type, and if the
   frontend looks categories up in a map, add `theft: { baseScore: 95, severity: 'CRITICAL', description: "Elliptic Binance hack blocklist" }`
   to the `categories` in `data/flagged-addresses.demo.json`.
2. **Activity log**: delete the seeded entry that says "ClearPass Verification Registry synchronized with NEAR
   Testnet contract." It's not a real event, and judges' AI screening checks claims like that.

## Settings to add to `.env`

```dotenv
# Where wallet history is read from. Real activity is on mainnet; reading is free and read-only.
# The ClearPass contract can stay on testnet.
SCAN_NETWORK=mainnet
# Optional: RPC for the scan network (default: FastNEAR public mainnet RPC)
SCAN_RPC_URL=
# Optional: raises NearBlocks rate limits
NEARBLOCKS_API_KEY=
# Senders followed per step beyond hop 1 (keeps scans within free rate limits)
SCAN_FANOUT=5
# Recommended for real data
MAX_HOP_DEPTH=2
DEFAULT_CERT_VALIDITY_DAYS=7
```

## Run

```powershell
node scripts/fetch-elliptic.mjs     # downloads the blocklist into data/blocklist.elliptic.json
npm run build
npm test
npm run dev
```

The backend log should say `[RealData] Loaded 24219 addresses from elliptic-binance-hack-2026 ...`.

## Expected results

| Wallet | Result |
|---|---|
| A NEAR address from Elliptic's list | REJECTED (direct match) |
| An account that received money from one, 1–2 steps back | REJECTED |
| An account that received FUK/OLCCL/MEILI/MMLI/DABI/SINU from the watch list | INCONCLUSIVE (needs review) |
| A normal account with ordinary history | APPROVED |
| An account with no readable history | INCONCLUSIVE |

## Limits (say these honestly)

- Reads the latest 25 transfers per account and follows the top `SCAN_FANOUT` senders per step.
- Elliptic's list covers the October 2026 Binance hack only. It isn't a sanctions check.
- Watch-listed tokens are a match on public facts (ticker, launch order and dates), not a confirmed attribution.
