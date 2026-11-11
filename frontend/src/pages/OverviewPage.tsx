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
  Sparkles,
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
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner / Hero */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gradient-to-bl from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10 group-hover:opacity-100 transition-opacity" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Privacy-Preserving Fund Risk Protocol</span>
          </div>

          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-3xl md:text-5xl font-normal text-white tracking-tight leading-tight mb-3"
          >
            Prove your funds are clean,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              without revealing your history.
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-light">
            ClearPass performs deterministic fund-risk assessments on the NEAR blockchain. Generate verifiable,
            tamper-proof cryptographic certificates that DeFi applications and exchanges can trust—while keeping your
            financial privacy intact.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => onNavigate('scanner')} className="btn btn-primary text-xs md:text-sm">
              <Search size={16} /> Start Risk Scanner
            </button>
            <button onClick={() => onNavigate('certificates')} className="btn btn-secondary text-xs md:text-sm">
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
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Connected NEAR Wallet</h3>
              <span className="badge badge-neutral text-[10px]">NEAR Testnet</span>
            </div>

            {isConnected && accountId ? (
              <div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Active Account ID</div>
                  <div className="text-sm md:text-base font-mono font-semibold text-emerald-400 break-all">
                    {accountId}
                  </div>
                </div>

                <button onClick={() => onNavigate('scanner')} className="btn btn-primary w-full text-xs">
                  <Search size={15} /> Scan This Wallet
                </button>
              </div>
            ) : (
              <div className="text-center py-6 px-4">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <HelpCircle size={22} />
                </div>
                <p className="text-slate-400 text-xs md:text-sm mb-4 leading-relaxed">
                  Connect a NEAR Testnet wallet or choose an instant synthetic demo account.
                </p>
                <button onClick={() => connect()} className="btn btn-primary text-xs">
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Latest Certificate Status */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Latest Certificate</h3>
              {latestCert && (
                <span
                  className={`badge ${
                    latestCert.outcome === 'APPROVED'
                      ? 'badge-approved'
                      : latestCert.outcome === 'REJECTED'
                      ? 'badge-rejected'
                      : 'badge-inconclusive'
                  } text-[10px]`}
                >
                  {latestCert.outcome}
                </span>
              )}
            </div>

            {latestCert ? (
              <div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Certificate ID</span>
                    <span className="text-white font-mono">{latestCert.certificateId.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Risk Score</span>
                    <span
                      className={`font-mono font-bold ${
                        latestCert.riskScore < 25 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {latestCert.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expires</span>
                    <span className="text-slate-300">
                      {new Date(latestCert.expiryTimestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('certificates')}
                  className="btn btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
                >
                  <span>View Certificate Details</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center py-6 px-4">
                <p className="text-slate-400 text-xs md:text-sm mb-4">
                  No certificates have been issued yet in this session.
                </p>
                <button onClick={() => onNavigate('scanner')} className="btn btn-secondary btn-sm text-xs">
                  Run First Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid-3">
        <div
          onClick={() => onNavigate('scanner')}
          className="glass-card cursor-pointer group hover:border-emerald-500/40 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Search size={20} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1.5">Risk Scanner</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Scan native NEAR and NEP-141 transfers up to 3 hops against synthetic flagged entities.
          </p>
        </div>

        <div
          onClick={() => onNavigate('auditor')}
          className="glass-card cursor-pointer group hover:border-cyan-500/40 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1.5">Auditor Portal</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Share restricted, encrypted reports with compliance auditors without leaking transaction history.
          </p>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="glass-card cursor-pointer group hover:border-violet-500/40 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1.5">Protocol & Risk List</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspect smart contract state, authorized issuers, and demo flagged dataset.
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm md:text-base font-semibold text-white">Recent Protocol Activity</h3>
          </div>
          <button onClick={() => onNavigate('activity')} className="btn btn-secondary btn-sm text-xs">
            View All Activity
          </button>
        </div>

        {activities.length > 0 ? (
          <div className="flex flex-col gap-2">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all text-xs"
              >
                <div>
                  <div className="font-medium text-white mb-0.5">{act.details}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Target: {act.walletAddress}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(act.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-xs text-center py-4">No recent protocol activity recorded.</div>
        )}
      </div>
    </div>
  );
};
