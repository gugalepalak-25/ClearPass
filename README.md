ClearPass — Privacy-Preserving Fund Risk Verification on NEAR

ClearPass lets a NEAR account holder prove that their funds passed a defined fund-risk check without publishing their transaction history. The result is a signed certificate, a minimal record in a NEAR smart contract, and an encrypted share that discloses only the fields the user allows to an auditor.

Built at NEAR HACKATHON (2026). Tracks: privacy, security <!-- TODO: confirm the final track list before submitting -->

	
Hosted demo	TODO: https://your-demo-site.example
Demo post on X	TODO: https://x.com/...
Contract (NEAR testnet)	TODO: your-contract.testnet, or "not deployed, local build only"
Network	NEAR testnet only
1. Problem

Public blockchains are transparent by design. To show that funds are clean, a user today has to hand over their full wallet history, which exposes their holdings, business relationships and counterparties. At the same time, exchanges, DeFi protocols and payment gateways need some proof that incoming funds don't come from mixers, exploits or sanctioned addresses.

2. What ClearPass does
Connect an account. Use NEAR Wallet Selector (MyNearWallet) or one of three built-in demo accounts. ClearPass never asks for a private key or seed phrase.
Scan for fund risk. ClearPass follows native NEAR and supported NEP-141 transfers up to 1–3 hops and checks counterparties against a flagged-address list.
Get a deterministic result. You get APPROVED, REJECTED or INCONCLUSIVE, with a 0–100 score and penalty points per counterparty. INCONCLUSIVE is never treated as approval.
Receive a certificate. The certificate is signed with Ed25519 and covered by a canonical SHA-256 digest.
Record it on NEAR. A Rust contract stores a minimal pass record (no transaction history). Anyone can call verify_pass / get_pass, and the issuer can revoke a pass.
Share it selectively with an auditor. The share is encrypted client-side with AES-256-GCM behind an access code. It reveals the outcome and score while hiding raw counterparties, and the user can revoke it.
3. How NEAR is used
Smart contract (contracts/, Rust, near-sdk 5.1): includes an issuer registry (register_issuer, revoke_issuer), the pass lifecycle (issue_pass, revoke_pass) and public verification (verify_pass, get_pass). Any third party can check a pass on-chain without contacting ClearPass.
NEAR accounts as identity: a pass is bound to a named NEAR account (*.testnet).
NEAR RPC: the backend reads account activity through https://rpc.testnet.near.org.
NEAR Wallet Selector: used for user sign-in (@near-wallet-selector/core, my-near-wallet).
4. Try it (judge walkthrough)
Prerequisites
Node.js 24 and npm
Rust (stable) with the WASM target: rustup target add wasm32-unknown-unknown
Run locally (macOS / Linux / Windows)
sh
git clone TODO-repo-url clearpass
cd clearpass
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run build:contract        # builds contracts/ to clearpass_contract.wasm (~323 KB)
npm run build                 # builds backend and frontend
npm test                      # 19 tests: 13 backend, 6 frontend
npm run dev                   # starts backend and frontend together
Frontend: http://localhost:5173
Backend API: http://localhost:3001 (health check: GET /api/health)

You don't need a wallet extension or any funds. The demo accounts cover the full flow.

Do X → see Y
Open http://localhost:5173 → you see the Overview dashboard with network testnet and a limited-scope trust notice.
Connect → choose demo account alice-clean-demo.testnet → the navbar shows the connected account.
Risk Scanner → select Scenario 1: Low-Risk Wallet, set hop depth 2, run the scan → a 5-step progress indicator runs, then you see APPROVED, score 4/100 with a per-counterparty breakdown.
Risk Scanner → select Scenario 2: Flagged Wallet (charlie-compromised-demo.testnet) → you see REJECTED, score 88/100, citing direct exposure to flagged-mixer-demo.testnet.
Risk Scanner → select Scenario 3: Insufficient Info (unknown-dormant-demo.testnet) → you see INCONCLUSIVE, score 48/100, and no pass is issued as approved.
After the APPROVED scan, issue a certificate → you get a certificate ID with an Ed25519 signature and SHA-256 digest.
Certificates → paste the certificate or ID and verify → you see the signature and digest are valid, plus the on-chain record lookup. Revoke it and verify again → it now shows as revoked.
Auditor → create a share with an access code and hide raw counterparties → you get an encrypted share package.
Auditor → Inspect → enter the access code → you see the outcome and score, but no counterparty list. Revoke the share → inspection no longer works.
Scenario reference
Scenario	Account	Hops	Outcome	Score	Why
1. Low-risk	alice-clean-demo.testnet	2	APPROVED	4	No flagged counterparties within scope
2. Flagged	charlie-compromised-demo.testnet	2	REJECTED	88	Direct counterparty flagged-mixer-demo.testnet
3. Insufficient data	unknown-dormant-demo.testnet	2	INCONCLUSIVE	48	Incomplete indexer history
Backend API
Method	Path	Purpose
GET	/api/health	Status, network, issuer
GET	/api/scenarios	The 3 demo scenarios
POST	/api/scan	Run a risk scan
POST	/api/certificates/issue	Issue a signed certificate
GET	/api/certificates/:id	Fetch a certificate
POST	/api/certificates/verify	Verify signature and digest
POST	/api/certificates/revoke	Revoke a certificate
POST	/api/auditor/share	Create an encrypted share
POST	/api/auditor/inspect	Decrypt a share with its access code
GET	/api/activity	Audit trail
5. Limitations (read before judging)
Synthetic risk data. The flagged-address list (data/flagged-addresses.demo.json) and the three demo accounts are synthetic. ClearPass is not connected to a real sanctions or threat-intelligence feed.
Limited scope. A pass means "no exposure to entries in the configured list within N hops." It does not certify that funds are lawful.
Off-chain scoring. Scoring runs on the backend. The contract stores and verifies the result and the issuer, not the computation.
Optional AI explanation. The plain-language explanation is optional. Without it, ClearPass falls back to a deterministic text. <!-- TODO: name the model/provider, e.g. NEAR AI Cloud, or remove -->
Testnet only.
6. Hackathon disclosure
Built during: the NEAR HACKATHON window (2026-10-19 to 2026-11-14). <!-- TODO: if any code predates 2026-10-19, say what it was and link the diff (tag `pre-hackathon` → `hackathon-submission`) -->
Third-party libraries: React 18, Vite 5, Lucide React, @near-wallet-selector/core, my-near-wallet, Fastify 4, @fastify/cors, @noble/hashes (behind a CSP-safe shim), near-sdk 5.1, Vitest 2, @testing-library/react, jsdom.
AI-assisted code: TODO: e.g. "Parts of the code were written with AI coding assistants."
Other projects by this team: TODO: name the other hackathon project and link its repo, or write "None."
Secrets: keys live only in .env, which is git-ignored. .env.example contains placeholders only.
7. Tech stack
Frontend: React 18, TypeScript, Vite 5, Lucide React, NEAR Wallet Selector
Backend: Node.js 24, TypeScript, Fastify 4, node:crypto (Ed25519, SHA-256, AES-256-GCM)
Contract: Rust 2021, near-sdk 5.1, wasm32-unknown-unknown
Tests: Vitest 2, @testing-library/react, jsdom
Security: strict Content Security Policy (no eval(), no new Function())
8. Project structure
clearpass/
├── frontend/     React + Vite app (pages: Overview, Scanner, Certificates, Auditor, Activity, Settings)
├── backend/      Fastify API: risk-engine/, certificates/, auditor/, ai/, services/ (NEAR RPC)
├── contracts/    Rust NEAR contract (src/lib.rs)
├── data/         flagged-addresses.demo.json (synthetic)
├── docs/         ARCHITECTURE.md, DEPLOYMENT.md, SECURITY.md
├── .env.example
└── package.json  npm workspaces and root scripts
9. Test results
Backend  (Vitest):         13/13 passed — health, scenarios, 3 scan outcomes, input validation,
                           certificate issue/get/verify/revoke, auditor share/inspect, activity
Frontend (Vitest + jsdom):  6/6 passed  — app render, branding, trust notice, stat card,
                           tab navigation, error boundary
Contract: cargo build --target wasm32-unknown-unknown --release → clearpass_contract.wasm (323 KB)
10. License

MIT — see LICENSE.