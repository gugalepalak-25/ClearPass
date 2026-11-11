# ClearPass — Privacy-Preserving Fund Risk Verification on NEAR

> *"Prove your money is clean, without showing anyone your history."*

ClearPass is a functional, end-to-end decentralized application built on the **NEAR blockchain**. It empowers Web3 users to prove that their funds have passed a defined fund-risk assessment without exposing their sensitive wallet transaction history to public scrutiny.

---

## 1. Problem & Proposed Solution

### The Problem
Public blockchain ledgers are transparent by design. However, sharing complete transaction histories exposes financial privacy, business relationships, and holdings. Simultaneously, DeFi protocols, exchanges, and payment gateways require proof that incoming funds do not originate from illicit entities (mixers, exploits, sanctioned watchlists).

### The ClearPass Solution
1. **Connect NEAR Wallet:** Connect via NEAR Wallet Selector or test with instant synthetic demo accounts.
2. **Fund Risk Scanner:** Scan Native NEAR and supported NEP-141 token transfers up to 3 transaction hops against known flagged entities.
3. **Deterministic Assessment:** Generates an **APPROVED**, **REJECTED**, or **INCONCLUSIVE** outcome based on deterministic scoring rules.
4. **Verifiable Certificate:** Issues an Ed25519-signed verification certificate with SHA-256 hash integrity.
5. **On-Chain Record:** Commits minimal verification records to a Rust-based NEAR smart contract.
6. **Auditor Portal:** Enables selective disclosure with AES-256-GCM encryption, disclosing only permitted proof fields while hiding full transaction history.

---

## 2. Demonstration Scenarios

ClearPass includes three pre-configured demonstration scenarios selectable in the **Risk Scanner**:

| Scenario | Target Account | Hop Depth | Expected Outcome | Risk Score | Key Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scenario 1: Low-Risk Wallet** | `alice-clean-demo.testnet` | 2 Hops | **APPROVED** | 4 / 100 | Clean counterparties, no exposure to flagged entities within scope. |
| **Scenario 2: Flagged Wallet** | `charlie-compromised-demo.testnet` | 2 Hops | **REJECTED** | 88 / 100 | Direct counterparty exposure to simulated mixer pool (`flagged-mixer-demo.testnet`). |
| **Scenario 3: Insufficient Info** | `unknown-dormant-demo.testnet` | 2 Hops | **INCONCLUSIVE** | 48 / 100 | Incomplete indexer history. Inconclusive is **never** treated as an approval. |

---

## 3. Quickstart Guide (Windows PowerShell)

Run these commands from the root repository directory `C:\clear`:

```powershell
# 1. Install all monorepo dependencies
npm install

# 2. Build the Rust smart contract WASM
npm run build:contract

# 3. Build backend and frontend packages
npm run build

# 4. Run the full automated test suite (19 tests)
npm test

# 5. Start both Backend and Frontend concurrently
npm run dev
```

- **Frontend URL:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **NEAR Testnet RPC:** `https://rpc.testnet.near.org`

---

## 4. Key Functional Modules

### A. Dashboard & Overview
- Connected account status and active NEAR network.
- Total verifications, active certificates, pass rate, and recent activity feed.
- Prominent limited-scope assessment trust notice.

### B. NEAR Wallet Selector
- Supports `@near-wallet-selector/core` and `my-near-wallet`.
- Integrated instant demo accounts (`alice-clean-demo.testnet`, `charlie-compromised-demo.testnet`, `unknown-dormant-demo.testnet`) allowing full functionality without requiring browser extensions.
- Zero private key or seed phrase entry.

### C. Multi-Hop Risk Scanner
- Selectable hop depth (1 to 3 hops).
- Real-time animated 5-step progress indicator.
- Deterministic score breakdown with penalty points per counterparty.
- AI Risk Intelligence explanation (optional, with automatic deterministic fallback).

### D. Certificate Registry & Verifier
- Cryptographic verification tool validating Ed25519 issuer signature and canonical SHA-256 digest.
- On-chain record lookup.
- Revocation management and raw JSON export.

### E. Auditor Portal (Selective Disclosure)
- Client-side AES-256-GCM encryption with access-code protection.
- Selective disclosure permissions (hide raw counterparties, reveal outcome/score).
- Auditor inspection view validating compliance proof while keeping raw history private.
- Instant share revocation.

### F. Rust Smart Contract (`clearpass-contract`)
- Developed in Rust using `near-sdk` 5.1.
- Implements: `register_issuer`, `revoke_issuer`, `issue_pass`, `verify_pass`, `get_pass`, `revoke_pass`.
- Compiles to `wasm32-unknown-unknown` (~323 KB).
- Stores minimal verification records only.

---

## 5. Technology Stack

- **Frontend:** React 18, TypeScript, Vite 5, Lucide React, NEAR Wallet Selector.
- **Backend:** Node.js 24, TypeScript, Fastify 4, `@fastify/cors`, `node:crypto`.
- **Smart Contract:** Rust 2021, `near-sdk` 5.1, WASM target.
- **Testing:** Vitest 2, `@testing-library/react`, `jsdom`.
- **Security:** Strict Content Security Policy (Zero `eval()`, Zero `new Function()`).

---

## 6. Project Structure

```
clearpass/
│
├── frontend/               # React 18 + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/     # Navbar, ErrorBoundary, StatCard, TrustNotice
│   │   ├── pages/          # Overview, Scanner, Certificates, Auditor, Activity, Settings
│   │   ├── wallet/         # NEAR Wallet Selector Context & Demo Switch
│   │   ├── services/       # REST API client
│   │   ├── shims/          # CSP-safe @noble/hashes sha256 drop-in shim
│   │   ├── styles/         # Dark forest-green & emerald CSS design system
│   │   ├── types/          # Shared frontend interfaces
│   │   └── App.tsx         # Main application controller
│   ├── vite.config.ts      # Vite bundler with strict CSP and alias config
│   └── package.json
│
├── backend/                # Fastify REST Server & Deterministic Risk Engine
│   ├── src/
│   │   ├── risk-engine/    # Multi-hop graph analysis & flagged address lookup
│   │   ├── certificates/   # Ed25519 signer & verification manager
│   │   ├── auditor/        # AES-256-GCM encrypted selective disclosure
│   │   ├── ai/             # Plain-language explanation generator with fallback
│   │   ├── services/       # Activity logging & NEAR RPC connector
│   │   ├── config.ts       # Centralized environment configuration
│   │   └── index.ts        # Fastify server entrypoint
│   └── package.json
│
├── contracts/              # Rust NEAR Smart Contract
│   ├── src/
│   │   └── lib.rs          # Contract state, verification methods, access control
│   ├── Cargo.toml          # near-sdk 5.1 configuration
│   └── target/wasm32...    # Compiled clearpass_contract.wasm (~323 KB)
│
├── data/
│   └── flagged-addresses.demo.json  # Configurable synthetic risk dataset
│
├── docs/
│   ├── ARCHITECTURE.md     # In-depth architectural specification
│   ├── DEPLOYMENT.md       # NEAR Testnet & local deployment manual
│   └── SECURITY.md         # Threat model, CSP compliance & limits
│
├── .env.example            # Environment configuration template
├── package.json            # Monorepo workspaces & root scripts
└── README.md
```

---

## 7. Verification & Test Results

```
Backend Test Suite (Vitest):
✓ GET /api/health (status, network, issuer)
✓ GET /api/scenarios (3 preconfigured scenarios)
✓ POST /api/scan -> Low-Risk Scenario => APPROVED (Score: 4)
✓ POST /api/scan -> Flagged Scenario => REJECTED (Score: 88)
✓ POST /api/scan -> Insufficient Data => INCONCLUSIVE (Score: 48)
✓ POST /api/scan -> Input validation (missing address handling)
✓ POST /api/certificates/issue -> Signed certificate generation
✓ GET /api/certificates/:id -> Certificate retrieval
✓ POST /api/certificates/verify -> Cryptographic signature check
✓ POST /api/certificates/revoke -> Revocation handling
✓ POST /api/auditor/share -> AES-256-GCM encrypted package creation
✓ POST /api/auditor/inspect -> Decryption with access code
✓ GET /api/activity -> Audit trail verification
(13/13 tests passed)

Frontend Test Suite (Vitest + JSDOM):
✓ Renders App root without crashing
✓ Renders brand title and protocol slogan
✓ Renders TrustNotice with limited-scope disclaimer
✓ Renders StatCard with custom metrics
✓ Switches navigation tabs (Scanner, Certificates, Auditor)
✓ ErrorBoundary gracefully catches child component errors
(6/6 tests passed)

Smart Contract Build:
✓ cargo build --target wasm32-unknown-unknown --release (clearpass_contract.wasm: 323 KB)
```

---

## 8. License

MIT License. Designed and built for the NEAR Blockchain Ecosystem.

