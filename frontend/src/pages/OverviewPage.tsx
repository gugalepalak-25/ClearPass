import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Award,
  Users,
  Activity as ActivityIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../components/StatCard.js';
import { TrustNotice } from '../components/TrustNotice.js';
import { useNearWallet } from '../wallet/NearWalletContext.js';
import { fetchCertificates, fetchActivity } from '../services/api.js';
import { VerificationCertificate, ActivityLogEntry } from '../types/index.js';

interface OverviewPageProps {
  onNavigate: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { accountId, isConnected, connect } = useNearWallet();
  const [certificates, setCertificates] = useState<VerificationCertificate[]>([]);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [certs, acts] = await Promise.all([
          fetchCertificates().catch(() => []),
          fetchActivity().catch(() => []),
        ]);
        setCertificates(certs);
        setActivities(acts);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCerts = certificates.length;
  const approvedCerts = certificates.filter((c) => c.outcome === 'APPROVED' && !c.revoked).length;
  const rejectedCerts = certificates.filter((c) => c.outcome === 'REJECTED').length;
  const latestCert = certificates[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Hero */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(12, 31, 23, 0.9) 0%, rgba(7, 22, 17, 0.95) 100%)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
          <div className="badge badge-approved" style={{ marginBottom: '12px' }}>
            Privacy-Preserving Fund Risk Protocol
          </div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#f0fdf4',
              letterSpacing: '-0.03em',
              marginBottom: '10px',
            }}
          >
            Prove your funds are clean, <br />
            <span style={{ color: '#34d399' }}>without revealing your transaction history.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
            ClearPass performs deterministic fund-risk assessments on the NEAR blockchain. Generate verifiable,
            tamper-proof cryptographic certificates that DeFi applications and exchanges can trust—while keeping your
            financial privacy intact.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('scanner')} className="btn btn-primary">
              <Search size={16} /> Start Risk Scanner
            </button>
            <button onClick={() => onNavigate('certificates')} className="btn btn-secondary">
              <Award size={16} /> View Certificates ({totalCerts})
            </button>
          </div>
        </div>
      </div>

      <TrustNotice />

      {/* Primary Metrics Grid */}
      <div className="grid-4">
        <StatCard
          title="Total Verifications"
          value={totalCerts}
          subtitle="Issued certificates"
          icon={Award}
          badge="+Live"
          badgeColor="emerald"
        />
        <StatCard
          title="Approved Certificates"
          value={approvedCerts}
          subtitle="Passed risk assessment"
          icon={CheckCircle2}
          badge="Clean"
          badgeColor="emerald"
        />
        <StatCard
          title="Flagged / Rejected"
          value={rejectedCerts}
          subtitle="Identified risk exposure"
          icon={AlertCircle}
          badge="High Risk"
          badgeColor={rejectedCerts > 0 ? 'red' : 'neutral'}
        />
        <StatCard
          title="Active NEAR Network"
          value="Testnet"
          subtitle="RPC: rpc.testnet.near.org"
          icon={ShieldCheck}
          badge="Online"
          badgeColor="emerald"
        />
      </div>

      {/* Connected Wallet & Latest Assessment Card */}
      <div className="grid-2">
        {/* Wallet Status Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>Connected NEAR Wallet</h3>
            <span className="badge badge-neutral">NEAR Testnet</span>
          </div>

          {isConnected && accountId ? (
            <div>
              <div
                style={{
                  padding: '14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Account ID</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#34d399', wordBreak: 'break-all' }}>
                  {accountId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => onNavigate('scanner')} className="btn btn-primary" style={{ flex: 1 }}>
                  <Search size={16} /> Scan This Wallet
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#94a3b8',
                }}
              >
                <HelpCircle size={22} />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                Connect a NEAR Testnet wallet or choose an instant synthetic demo account.
              </p>
              <button onClick={() => connect()} className="btn btn-primary">
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Latest Certificate Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>Latest Certificate</h3>
            {latestCert && (
              <span
                className={`badge ${
                  latestCert.outcome === 'APPROVED'
                    ? 'badge-approved'
                    : latestCert.outcome === 'REJECTED'
                    ? 'badge-rejected'
                    : 'badge-inconclusive'
                }`}
              >
                {latestCert.outcome}
              </span>
            )}
          </div>

          {latestCert ? (
            <div>
              <div
                style={{
                  padding: '14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Certificate ID</span>
                  <span style={{ fontSize: '0.8rem', color: '#f0fdf4', fontFamily: 'var(--font-mono)' }}>
                    {latestCert.certificateId.slice(0, 16)}...
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Risk Score</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: latestCert.riskScore < 25 ? '#34d399' : '#f87171' }}>
                    {latestCert.riskScore}/100
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Expires</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {new Date(latestCert.expiryTimestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('certificates')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                View Certificate Details <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '14px' }}>
                No certificates have been issued yet in this session.
              </p>
              <button onClick={() => onNavigate('scanner')} className="btn btn-secondary btn-sm">
                Run First Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid-3">
        <div
          onClick={() => onNavigate('scanner')}
          className="glass-card"
          style={{ cursor: 'pointer' }}
        >
          <div style={{ color: '#34d399', marginBottom: '8px' }}>
            <Search size={22} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0fdf4', marginBottom: '4px' }}>
            Risk Scanner
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Scan native NEAR and NEP-141 transfers up to 3 hops against synthetic flagged entities.
          </p>
        </div>

        <div
          onClick={() => onNavigate('auditor')}
          className="glass-card"
          style={{ cursor: 'pointer' }}
        >
          <div style={{ color: '#34d399', marginBottom: '8px' }}>
            <Users size={22} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0fdf4', marginBottom: '4px' }}>
            Auditor Portal
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Share restricted, encrypted reports with compliance auditors without leaking transaction history.
          </p>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="glass-card"
          style={{ cursor: 'pointer' }}
        >
          <div style={{ color: '#34d399', marginBottom: '8px' }}>
            <ShieldCheck size={22} />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0fdf4', marginBottom: '4px' }}>
            Protocol & Risk List
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Inspect smart contract state, authorized issuers, and demo flagged dataset.
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ActivityIcon size={18} color="#34d399" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>Recent Protocol Activity</h3>
          </div>
          <button onClick={() => onNavigate('activity')} className="btn btn-secondary btn-sm">
            View All Activity
          </button>
        </div>

        {activities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#f0fdf4', marginBottom: '2px' }}>
                    {act.details}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Target: {act.walletAddress}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {new Date(act.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
            No recent protocol activity recorded.
          </div>
        )}
      </div>
    </div>
  );
};

