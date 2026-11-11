# ClearPass Security Architecture & Threat Model

This document outlines the security specifications, threat mitigations, cryptographic foundations, and operational limits of the ClearPass protocol.

---

## 1. Core Security Model

ClearPass is designed around a fundamental principle:

> **"Prove your money is clean, without showing anyone your history."**

The protocol facilitates proof of compliance with a defined risk assessment without broadcasting the user's complete financial transactions to counterparties, DeFi protocols, or public registries.

---

## 2. Threat Analysis & Mitigations

### Threat A: Exposure of Private Transaction History
- **Risk:** Standard blockchain compliance tools require uploading or publicly disclosing an account's complete transaction history.
- **ClearPass Mitigation:**
  1. The client connects to an assessment authority.
  2. Transaction history is evaluated and normalized **locally or within server memory**.
  3. The resulting on-chain certificate and public verification record contain **zero raw transaction records**.
  4. In the Auditor Portal, reports are encrypted using **AES-256-GCM**, and raw counterparties are redacted by default.

### Threat B: Certificate Tampering or Forgery
- **Risk:** Malicious users alter a certificate's outcome from `REJECTED` to `APPROVED` or modify the risk score.
- **ClearPass Mitigation:**
  1. All certificates are hashed using deterministic canonical JSON stringification and **SHA-256**.
  2. The hash is signed with the issuer's private **Ed25519** authority key.
  3. Modifying even a single character in the certificate ID, score, or timestamp invalidates the signature.
  4. The NEAR smart contract records the immutable `cert_hash` on-chain.

### Threat C: Content Security Policy & Eval Injection
- **Risk:** Third-party libraries utilizing dynamic `eval()` or `new Function()` cause browser runtime crashes under strict CSP directives.
- **ClearPass Mitigation:**
  1. No `eval()` or `new Function()` is used anywhere in frontend or backend application code.
  2. Legacy dependencies (such as `js-sha256`) that employ `eval("require('crypto')")` have been systematically replaced with an audited, zero-eval `@noble/hashes` shim.
  3. Strict CSP headers are enforced in `index.html`.

### Threat D: Private Key Disclosure
- **Risk:** Inadvertent leakage of the certificate signing key.
- **ClearPass Mitigation:**
  1. Private keys are loaded strictly from server-side environment variables (`CERTIFICATE_SIGNING_PRIVATE_KEY`).
  2. The frontend is never given access to private keys; only public keys are shared for signature verification.
  3. Development environments auto-generate secure in-memory ephemeral keys when environment variables are omitted.

### Threat E: Malicious or Hallucinated AI Decisions
- **Risk:** AI models making arbitrary or non-deterministic compliance approvals.
- **ClearPass Mitigation:**
  1. AI is strictly prohibited from making approval or rejection decisions.
  2. The risk score and outcome (`APPROVED`, `REJECTED`, `INCONCLUSIVE`) are calculated by **100% deterministic rules**.
  3. AI is utilized solely to format explanations in human-readable prose.
  4. If the AI service is unreachable, high-fidelity deterministic explanations execute as the primary fallback.

---

## 3. Protocol Limitations & Disclaimers

### Limited-Scope Assessment
- An `APPROVED` status indicates that no matching flagged entities were detected **within the configured hop depth (1-3 hops), time window (90 days), and specified risk-list version**.
- It does **not** claim or guarantee that an account is absolutely or perpetually clean.
- Assessments are snapshots valid until the certificate's `expiryTimestamp`.

### Inconclusive Is Never an Approval
- If NEAR RPC or historical indexer data is unavailable or incomplete, the protocol marks the assessment as `INCONCLUSIVE`.
- Inconclusive results cannot be certified as approved.

### Attestation Transparency
- ClearPass uses standard cryptographic digital signatures.
- It does not present standard signatures as hardware TEE or zero-knowledge SNARK proofs.

