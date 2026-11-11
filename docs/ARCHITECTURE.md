# ClearPass Architecture Specification

## Privacy-Preserving Fund Risk Verification on NEAR

### 1. System Overview

ClearPass is a decentralized application built on the NEAR blockchain that enables users to demonstrate compliance with a defined risk assessment without disclosing their full wallet transaction history.

> **Core Concept:** *"Prove your money is clean, without showing anyone your history."*

ClearPass explicitly communicates that an evaluated wallet has passed a **specific, limited-scope assessment** within configured parameters (hop depth, time window, and risk-list version). It never makes false claims of absolute or perpetual fund cleanliness.

---

### 2. Architectural Layers

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENT                                    |
|   +---------------------------------------------------------------------------+   |
|   |                      ClearPass Web Application (React + Vite)             |   |
|   |  * Overview Dashboard     * Risk Scanner (1-3 Hops)                       |   |
|   |  * Certificate Registry   * Auditor Portal (AES-256-GCM Decryption)       |   |
|   |  * Activity Trail         * Protocol & Attestation Settings               |   |
|   +---------------------------------------------------------------------------+   |
|                                         |                                         |
|                 NEAR Wallet Selector    | REST API (Strict CSP, Zero eval)        |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                                CLEARPASS BACKEND                                  |
|   +---------------------------------------------------------------------------+   |
|   |                             Fastify REST Engine                           |   |
|   +---------------------------------------------------------------------------+   |
|         |                                      |                     |            |
|         v                                      v                     v            |
|   +-------------------+             +--------------------+ +--------------------+ |
|   |    Risk Engine    |             | Certificate Signer | | Auditor Encryption | |
|   | * Multi-hop Graph |             | * SHA-256 Hash     | | * AES-256-GCM      | |
|   | * Deterministic   |             | * Ed25519 Keypair  | | * Scrypt KDF       | |
|   |   Outcome Rules   |             | * Tamper-Detection | | * Redacted Payload | |
|   +-------------------+             +--------------------+ +--------------------+ |
|         |                                      |                                  |
+---------|--------------------------------------|----------------------------------+
          v                                      v
+-----------------------------+       +---------------------------------------------+
|    NEAR PROTOCOL (Testnet)  |       |             NEAR SMART CONTRACT             |
| * RPC Node (Testnet)        |       | * Rust (near-sdk 5.1)                       |
| * Archival Query Nodes      |       | * Methods: issue_pass, verify_pass,         |
| * Account State & History   |       |   revoke_pass, register_issuer              |
+-----------------------------+       | * Minimal On-Chain Record (Zero tx history) |
                                      +---------------------------------------------+
```

---

### 3. Component Breakdown

#### A. Frontend (React 18 + TypeScript + Vite)
- **Design System:** Custom dark theme featuring deep forest green (`#071611`), near-black (`#050c09`), muted emerald (`#10b981`), amber (`#f59e0b`), and red (`#ef4444`).
- **Security & CSP:** 100% compliant with strict Content Security Policy. Completely eliminates `eval()` and `new Function()` by replacing legacy hashing libraries with audited `@noble/hashes` drop-in shims.
- **Resilience:** Multi-tier React `ErrorBoundary` wrappers prevent white screen crashes and provide graceful reload fallbacks.
- **Wallet Integration:** NEAR Wallet Selector with support for MyNearWallet and instant synthetic testnet demo profiles.

#### B. Risk Assessment Engine
- **Data Ingestion:** Normalizes native NEAR transfers and supported NEP-141 token transfers into uniform counterparty graphs.
- **Configurable Risk List:** Cross-references addresses against versioned synthetic datasets (`data/flagged-addresses.demo.json`) covering mixers, exploiters, sanctioned entities, phishing drainers, and high-risk counterparties.
- **Hop Decay Scoring:**
  - Hop 0 (Direct match): Up to 95-100 penalty points.
  - Hop 1 (Direct counterparty): Up to 85-90 penalty points.
  - Hop 2 (Secondary exposure): Up to 40-45 penalty points.
  - Hop 3 (Tertiary exposure): Up to 15-20 penalty points.
- **Deterministic Outcomes:**
  - `APPROVED`: Risk score < 25, no critical indicators, adequate data available.
  - `REJECTED`: Score >= 50 or confirmed direct/indirect flagged counterparty.
  - `INCONCLUSIVE`: Insufficient or missing transaction history. An inconclusive result is **never** treated as an approval.
- **AI Explanation Module:** AI is strictly used for plain-language summarization of identified factors; it is mathematically prevented from overriding deterministic rules. If no AI API key is configured, high-fidelity rule-based explanations execute seamlessly.

#### C. Certificate Authority & Cryptographic Proofs
- **Canonical Hashing:** Creates deterministic SHA-256 digest of `{ certificateId, walletAddress, network, outcome, riskScore, assessmentTimestamp, expiryTimestamp, hopDepth, riskListVersion, issuerIdentity }`.
- **Ed25519 Digital Signature:** Server-side signing using PKCS#8 Ed25519 private keys. Client and auditor verification detects any single-byte alteration.
- **Attestation Clarity:** Transparently documents that standard digital signatures are used. Does not claim fake hardware TEE or fake zero-knowledge proofs.

#### D. Auditor Portal & Selective Disclosure
- **Selective Permissions:** Users configure disclosure boundaries (Outcome only, Risk Score, Hop Depth, Findings Summary).
- **Zero Counterparty Leakage:** Raw transaction counterparties are explicitly hidden.
- **Cryptographic Encryption:** AES-256-GCM encryption with access-code-derived keys (Scrypt KDF).
- **Auditor Verification:** Verifiers decrypt permitted fields, validate the Ed25519 issuer signature, and check on-chain revocation status.

#### E. NEAR Smart Contract (`clearpass-contract`)
- **Language:** Rust (using `near-sdk` 5.1).
- **Binary Target:** `wasm32-unknown-unknown` (release size: ~323 KB).
- **Storage Strategy:** Stores only minimal verification records (`certificate_id`, `subject_account_id`, `outcome`, `risk_score`, `risk_list_version`, `expires_at_ns`, `cert_hash`, `issuer_account_id`, `revoked`). Complete transaction histories are never stored on-chain.
- **Access Control:** Privileged methods (`register_issuer`, `revoke_issuer`) restricted to contract owner; issuance (`issue_pass`) restricted to registered authorities.

---

### 4. Cryptographic Distinction

| Feature | ClearPass Protocol Implementation | What It Guarantees |
| :--- | :--- | :--- |
| **Digital Signature** | Active (Ed25519) | Proves an authorized authority executed the assessment and that certificate fields have not been altered. |
| **Selective Disclosure** | Active (AES-256-GCM + Scrypt) | Ensures auditors only receive permitted compliance data without seeing complete transaction history. |
| **Hardware TEE** | Marked Inactive in Demo | Intel SGX / AMD SEV confidential memory isolation. Transparently labelled as unavailable in local demo mode. |
| **Zero-Knowledge Proof** | Protocol Functional Equivalent | Functional selective privacy without claiming a backend signature is a mathematical ZK-SNARK. |

