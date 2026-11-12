import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Server,
  Terminal,
} from 'lucide-react';
import { fetchHealth, fetchContractInfo } from '../services/api.js';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [contractInfo, setContractInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [h, c] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchContractInfo().catch(() => null),
      ]);
      setHealth(h);
      setContractInfo(c);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (health?.issuerPublicKey) {
      navigator.clipboard.writeText(health.issuerPublicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[420px] h-[300px] bg-gradient-to-bl from-purple-600/30 via-violet-600/20 to-transparent rounded-full blur-[100px] pointer-events-none -z-10 group-hover:opacity-100 transition-opacity" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Settings className="w-3.5 h-3.5" />
            <span>Infrastructure & Protocol Config</span>
          </div>

          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight mb-3"
          >
            Protocol &{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              Network Settings
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
            Inspect active NEAR Testnet endpoints, smart contract configuration, issuer cryptographic authority,
            and honest attestation architecture guarantees.
          </p>
        </div>
      </div>

      {/* Grid: Network & Contract Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network & RPC Status */}
        <div className="liquid-glass rounded-3xl p-6 md:p-7 border border-white/10 shadow-xl flex flex-col gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">NEAR Blockchain Network</h3>
                <p className="text-xs text-slate-400">Decentralized network connection</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Online
            </span>
          </div>

          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Network ID</span>
              <span className="text-purple-300 font-mono font-bold">testnet</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Primary JSON-RPC</span>
              <span className="text-white font-mono text-[11px] truncate max-w-[220px]">
                {health?.rpcUrl || 'https://rpc.testnet.near.org'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Archival RPC</span>
              <span className="text-white font-mono text-[11px] truncate max-w-[220px]">
                https://archival-rpc.testnet.near.org
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">FastNEAR API Node</span>
              <span className="text-white font-mono text-[11px]">https://testnet.api.fastnear.com</span>
            </div>
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="liquid-glass rounded-3xl p-6 md:p-7 border border-white/10 shadow-xl flex flex-col gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Database size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">NEAR Smart Contract</h3>
                <p className="text-xs text-slate-400">On-chain verification registry</p>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-mono">Rust near-sdk 5.1</span>
          </div>

          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Contract Account ID</span>
              <a
                href={`https://testnet.nearblocks.io/address/${contractInfo?.contractId || 'clearpass.testnet'}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300 font-mono font-bold hover:underline flex items-center gap-1.5"
              >
                <span>{contractInfo?.contractId || 'clearpass.testnet'}</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Compiled WASM Binary</span>
              <span className="text-white font-mono text-[11px]">clearpass_contract.wasm (323 KB)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Storage Optimization</span>
              <span className="text-purple-300 font-semibold">Minimal zero-knowledge footprint</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]">
              <span className="text-slate-400">Contract Methods</span>
              <span className="text-white font-mono text-[11px]">issue_cert, verify_cert, revoke_cert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Certificate Authority & Key Info */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-5 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cryptographic Certificate Authority</h3>
              <p className="text-xs text-slate-400">Ed25519 high-speed asymmetric digital signature keypair</p>
            </div>
          </div>

          <button
            onClick={handleCopyKey}
            className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass text-white/80 hover:text-white hover:border-purple-500/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            {copiedKey ? <Check size={14} className="text-purple-300" /> : <Copy size={14} />}
            <span>{copiedKey ? 'Key Copied!' : 'Copy Public Key'}</span>
          </button>
        </div>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          ClearPass issues tamper-proof verification certificates signed with an authoritative Ed25519 private key.
          Third-party smart contracts, dApps, or external verifiers can cryptographically validate any certificate
          payload against the public key below without trusting our backend.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Issuer Public Key (SPKI PEM)</span>
            <span className="font-mono text-purple-300">Curve: ed25519 / RFC 8032</span>
          </div>

          <pre className="p-4 rounded-2xl liquid-glass border border-white/10 bg-black/60 font-mono text-xs text-purple-200 overflow-x-auto select-all leading-relaxed">
            {health?.issuerPublicKey || '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA...\n-----END PUBLIC KEY-----'}
          </pre>
        </div>
      </div>

      {/* Security Architecture & Transparency Callout */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-5 relative overflow-hidden">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cryptographic Guarantees & Transparency Architecture</h3>
            <p className="text-xs text-slate-400">
              ClearPass maintains complete technical transparency regarding privacy and attestation layers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="liquid-glass rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={16} />
              <span>Digital Signatures (Active)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Proves that the ClearPass verification authority assessed the target wallet and signed the deterministic
              outcome. Any modification of scores, dates, or outcomes invalidates the Ed25519 signature.
            </p>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex items-center justify-center text-[9px]">
                !
              </span>
              <span>Hardware TEE (Inactive in Demo)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Confidential compute enclaves (Intel SGX / AMD SEV) protect in-memory data during computation. In this
              local demonstration, hardware TEE attestation is transparently marked unavailable rather than simulated.
            </p>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-cyan-500/30 bg-cyan-500/5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sparkles size={16} />
              <span>Selective Disclosure (ZKP Alternative)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Instead of generating heavy ZK-SNARK proving keys client-side, ClearPass uses AES-256-GCM selective
              disclosure tokens. You disclose only the certificate outcome while redacting full counterparty records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
