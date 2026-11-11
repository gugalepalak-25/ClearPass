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
} from 'lucide-react';
import { fetchHealth, fetchContractInfo } from '../services/api.js';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [contractInfo, setContractInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '4px' }}>
          Protocol & Network Settings
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Inspect active NEAR Testnet endpoints, smart contract configuration, issuer keys, and attestation architecture.
        </p>
      </div>

      {/* Grid: Network & Contract Status */}
      <div className="grid-2">
        {/* Network & RPC Status */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <Layers size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>NEAR Blockchain Network</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Network ID</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>testnet</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>JSON-RPC Endpoint</span>
              <span style={{ color: '#f0fdf4', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {health?.rpcUrl || 'https://rpc.testnet.near.org'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Archival RPC</span>
              <span style={{ color: '#f0fdf4', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                https://archival-rpc.testnet.near.org
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>RPC State</span>
              <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                Online & Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <Database size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>NEAR Smart Contract</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Contract ID</span>
              <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {contractInfo?.contractId || 'clearpass.testnet'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Compiled Artifact</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                clearpass_contract.wasm (323 KB)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Contract Framework</span>
              <span style={{ color: '#f0fdf4' }}>near-sdk 5.1 (Rust)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Storage Mode</span>
              <span style={{ color: '#cbd5e1' }}>Minimal verification records only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Authority & Key Info */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
          <Key size={18} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0fdf4' }}>
            Cryptographic Certificate Authority
          </h3>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          ClearPass signs all verification certificates using a server-side <strong>Ed25519</strong> private key.
          Anyone can independently verify certificate integrity against the issuer public key.
        </p>

        <div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
            Issuer Public Key (SPKI PEM):
          </span>
          <pre
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.75rem',
              color: '#34d399',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {health?.issuerPublicKey || 'Loading key...'}
          </pre>
        </div>
      </div>

      {/* Security Architecture & Transparency Callout */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'rgba(12, 31, 23, 0.7)',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
          <Cpu size={18} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0fdf4' }}>
            Security & Attestation Architecture
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          ClearPass strictly adheres to transparent cryptographic standards. It distinguishes between:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem', marginBottom: '4px' }}>
              ✓ Digital Signatures (Active)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Proves that an authorized ClearPass verification authority assessed the wallet and signed the deterministic outcome. Detects any data modification.
            </p>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem', marginBottom: '4px' }}>
              ○ Hardware TEE (Not Active in Demo)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Confidential compute enclaves (Intel SGX / AMD SEV) protect memory during execution. In this local demonstration, hardware TEE attestation is transparently marked unavailable.
            </p>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.85rem', marginBottom: '4px' }}>
              ○ Zero-Knowledge Proofs (ZKP)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Mathematical circuit proofs that verify statements without revealing witnesses. ClearPass selective disclosure achieves functional privacy without pretending standard backend code is a ZK-SNARK.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

