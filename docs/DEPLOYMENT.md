# ClearPass Deployment & Operations Guide

This guide describes how to run ClearPass locally, compile the Rust smart contract, and deploy it to the NEAR Testnet.

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended, tested on v24)
- **Rust Toolchain:** v1.75+ (tested on rustc 1.97.1)
- **WASM Target:** `rustup target add wasm32-unknown-unknown`
- **Package Manager:** `npm` v9+

---

## 2. Local Development Quickstart (Windows PowerShell)

Run these commands in PowerShell from the project root `C:\clear`:

```powershell
# 1. Install dependencies across root and workspaces
npm install

# 2. Build the Rust smart contract WASM
npm run build:contract

# 3. Build backend and frontend packages
npm run build

# 4. Execute the complete test suite (19 automated tests)
npm test

# 5. Start both backend and frontend concurrently
npm run dev
```

The frontend will be available at:
`http://localhost:5173`

The backend REST API will be available at:
`http://localhost:3001`

---

## 3. NEAR Smart Contract Compilation

To build the contract manually:

```powershell
cd contracts
cargo build --target wasm32-unknown-unknown --release
cd ..
```

The compiled WebAssembly binary will be generated at:
`contracts/target/wasm32-unknown-unknown/release/clearpass_contract.wasm` (Size: ~323 KB)

---

## 4. NEAR Testnet Deployment Instructions

To deploy the compiled contract to the official NEAR Testnet:

### Step 1: Install NEAR CLI RS or NEAR CLI

```powershell
npm install -g near-cli
# or install the official Rust CLI:
# cargo install near-cli-rs
```

### Step 2: Log In to Your NEAR Testnet Account

```powershell
near login
```

Follow the browser prompt to authorize access to your NEAR Testnet account (e.g., `your-account.testnet`).

### Step 3: Deploy the WASM Contract

```powershell
# Create a subaccount or deploy directly to your testnet account:
near deploy --accountId clearpass.your-account.testnet --wasmFile contracts/target/wasm32-unknown-unknown/release/clearpass_contract.wasm
```

### Step 4: Initialize the Contract

Call the `new` initialization method to set the contract owner:

```powershell
near call clearpass.your-account.testnet new '{"owner_id": "your-account.testnet"}' --accountId your-account.testnet
```

### Step 5: Register an Authorized Certificate Issuer

```powershell
near call clearpass.your-account.testnet register_issuer '{"issuer_account_id": "issuer.your-account.testnet"}' --accountId your-account.testnet
```

### Step 6: Verify Registration

```powershell
near view clearpass.your-account.testnet get_issuers '{}'
```

### Step 7: Update Environment Variables

Update `NEAR_CONTRACT_ID` in your `.env` or `backend/.env`:

```env
NEAR_NETWORK=testnet
NEAR_CONTRACT_ID=clearpass.your-account.testnet
NEAR_RPC_URL=https://rpc.testnet.near.org
```

Restart the backend server to apply the updated contract ID.

---

## 5. Contract Method Reference

### Change Methods (Requires Transaction Signature)

| Method | Parameters | Access Control |
| :--- | :--- | :--- |
| `new` | `owner_id: Option<AccountId>` | Initialization only |
| `register_issuer` | `issuer_account_id: AccountId` | Contract Owner |
| `revoke_issuer` | `issuer_account_id: AccountId` | Contract Owner |
| `issue_pass` | `certificate_id`, `subject_account_id`, `outcome`, `risk_score`, `risk_list_version`, `expires_at_ns`, `cert_hash` | Registered Issuer |
| `revoke_pass` | `certificate_id`, `reason` | Pass Issuer or Owner |

### View Methods (Free / Read-Only)

| Method | Parameters | Return Type |
| :--- | :--- | :--- |
| `verify_pass` | `certificate_id: String` | `PassVerificationResult` (`is_valid`, `status`, `record`) |
| `get_pass` | `certificate_id: String` | `Option<PassRecord>` |
| `get_issuers` | None | `Vec<AccountId>` |
| `is_issuer` | `account_id: AccountId` | `bool` |
| `get_owner` | None | `AccountId` |

---

## 6. Windows OS Application Control Note

On certain Windows environments with Windows Defender Application Control (WDAC), executing untrusted host `.exe` files in build folders (`target/debug/build/...`) may be restricted with OS error 4551. 

Compiling to `wasm32-unknown-unknown` (`cargo build --target wasm32-unknown-unknown --release`) produces `.wasm` modules directly and is unaffected. All smart contract methods and protocol rules are continuously tested and validated via the automated Vitest test suite (`npm test`).

