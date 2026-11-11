import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

dotenv.config();

export interface AppConfig {
  port: number;
  host: string;
  allowedOrigin: string;
  nearNetwork: string;
  nearRpcUrl: string;
  nearArchivalRpcUrl: string;
  nearContractId: string;
  issuerName: string;
  issuerPrivateKey: string;
  issuerPublicKey: string;
  aiApiKey?: string;
  aiModel: string;
  maxHopDepth: number;
  defaultCertValidityDays: number;
  riskListPath: string;
}

// In-memory key persistence if none provided in env
let cachedPrivateKey = process.env.CERTIFICATE_SIGNING_PRIVATE_KEY || '';
let cachedPublicKey = process.env.CERTIFICATE_SIGNING_PUBLIC_KEY || '';

if (!cachedPrivateKey || !cachedPublicKey) {
  // Generate ed25519 keypair for developmental / local execution
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  cachedPrivateKey = privateKey;
  cachedPublicKey = publicKey;
}

const resolvedRiskListPath = (() => {
  const custom = process.env.RISK_LIST_PATH;
  if (custom && fs.existsSync(custom)) {
    return path.resolve(custom);
  }
  const primary = path.resolve(process.cwd(), '../data/flagged-addresses.demo.json');
  if (fs.existsSync(primary)) {
    return primary;
  }
  const localFallback = path.resolve(process.cwd(), 'data/flagged-addresses.demo.json');
  if (fs.existsSync(localFallback)) {
    return localFallback;
  }
  return primary;
})();

export const config: AppConfig = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || '127.0.0.1',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  nearNetwork: process.env.NEAR_NETWORK || 'testnet',
  nearRpcUrl: process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org',
  nearArchivalRpcUrl: process.env.NEAR_ARCHIVAL_RPC_URL || 'https://archival-rpc.testnet.near.org',
  nearContractId: process.env.NEAR_CONTRACT_ID || 'clearpass.testnet',
  issuerName: process.env.ISSUER_NAME || 'ClearPass Verification Authority (NEAR Testnet)',
  issuerPrivateKey: cachedPrivateKey,
  issuerPublicKey: cachedPublicKey,
  aiApiKey: process.env.AI_API_KEY || undefined,
  aiModel: process.env.AI_MODEL || 'deterministic-fallback',
  maxHopDepth: Number(process.env.MAX_HOP_DEPTH || 3),
  defaultCertValidityDays: Number(process.env.DEFAULT_CERT_VALIDITY_DAYS || 30),
  riskListPath: resolvedRiskListPath,
};

