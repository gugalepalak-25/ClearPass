import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  createAuditorShare,
  fetchAuditorShares,
  inspectAuditorShare,
  revokeAuditorShare,
  fetchCertificates,
} from '../services/api.js';
import {
  SelectiveDisclosurePackage,
  SelectiveDisclosurePermissions,
  VerificationCertificate,
} from '../types/index.js';
import { TrustNotice } from '../components/TrustNotice.js';

interface AuditorPageProps {
  initialCertId?: string;
}

export const AuditorPage: React.FC<AuditorPageProps> = ({ initialCertId }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'inspect' | 'manage'>('create');
  const [certificates, setCertificates] = useState<VerificationCertificate[]>([]);
  const [shares, setShares] = useState<SelectiveDisclosurePackage[]>([]);

  // Create Share Form State
  const [selectedCertId, setSelectedCertId] = useState<string>(initialCertId || '');
  const [recipientName, setRecipientName] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [customAccessCode, setCustomAccessCode] = useState<string>('');
  const [permissions, setPermissions] = useState<SelectiveDisclosurePermissions>({
    discloseOutcome: true,
    discloseRiskScore: true,
    discloseScopeAndHopDepth: true,
    discloseFindingsSummary: true,
    discloseRawCounterparties: false, // Default false for privacy!
  });

  const [creating, setCreating] = useState<boolean>(false);
  const [createdShareResult, setCreatedShareResult] = useState<{
    share: SelectiveDisclosurePackage;
    accessCode: string;
  } | null>(null);

  // Inspect Portal State
  const [inspectShareId, setInspectShareId] = useState<string>('');
  const [inspectAccessCode, setInspectAccessCode] = useState<string>('');
  const [inspecting, setInspecting] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [decryptedReport, setDecryptedReport] = useState<Record<string, any> | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialCertId) {
      setSelectedCertId(initialCertId);
      setActiveTab('create');
    }
  }, [initialCertId]);

  const loadData = async () => {
    try {
      const [certs, shs] = await Promise.all([
        fetchCertificates().catch(() => []),
        fetchAuditorShares().catch(() => []),
      ]);
      setCertificates(certs);
      setShares(shs);
      if (certs.length > 0 && !selectedCertId) {
        setSelectedCertId(certs[0].certificateId);
      }
    } catch (err) {
      console.warn('Failed to load auditor data:', err);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedCertId || !recipientName.trim()) {
      alert('Please select a certificate and enter recipient name/organization.');
      return;
    }

    setCreating(true);
    try {
      const result = await createAuditorShare(
        selectedCertId,
        recipientName.trim(),
        expiresInDays,
        permissions,
        customAccessCode.trim() || undefined
      );
      setCreatedShareResult(result);
      setShares((prev) => [result.share, ...prev]);
    } catch (err: any) {
      alert(`Error creating share: ${err?.message || 'Failed to create share'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleInspect = async () => {
    if (!inspectShareId.trim() || !inspectAccessCode.trim()) {
      setInspectError('Both Share ID and Access Code are required.');
      return;
    }

    setInspecting(true);
    setInspectError(null);
    setDecryptedReport(null);

    try {
      const result = await inspectAuditorShare(inspectShareId.trim(), inspectAccessCode.trim());
      setDecryptedReport(result.decryptedReport);
    } catch (err: any) {
      setInspectError(err?.message || 'Decryption failed: Invalid access code or expired share.');
    } finally {
      setInspecting(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this auditor share link?')) return;
    try {
      await revokeAuditorShare(shareId);
      setShares((prev) =>
        prev.map((s) => (s.shareId === shareId ? { ...s, status: 'REVOKED' } : s))
      );
    } catch (err: any) {
      alert(`Failed to revoke share: ${err?.message || 'Error'}`);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[420px] h-[300px] bg-gradient-to-bl from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-[100px] pointer-events-none -z-10 group-hover:opacity-100 transition-opacity" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Selective Disclosure</span>
          </div>

          <h1
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-3xl md:text-5xl font-normal tracking-tight leading-tight mb-3 bg-gradient-to-r from-white via-white/95 to-emerald-300 bg-clip-text text-transparent"
          >
            Auditor Portal & Selective Disclosure
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-light">
            Share verifiable compliance evidence with authorized auditors, exchanges, and institutional counterparties
            without exposing your full transaction history or counterparty addresses.
          </p>
        </div>
      </div>

      <TrustNotice />

      {/* Navigation Mode Tabs */}
      <div className="liquid-glass rounded-2xl p-1.5 border border-white/10 flex flex-wrap gap-2 w-fit">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20'
              : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Lock size={15} /> 1. Create Restricted Share
        </button>

        <button
          onClick={() => setActiveTab('inspect')}
          className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inspect'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20'
              : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Unlock size={15} /> 2. Auditor Verification Portal
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'manage'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20'
              : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users size={15} /> 3. Active Shares ({shares.length})
        </button>
      </div>

      {/* Mode 1: Create Selective Disclosure Share */}
      {activeTab === 'create' && (
        <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Generate Restricted Share Package</h2>
              <p className="text-xs text-slate-400">
                Encrypt compliance evidence with AES-256-GCM. Only grant what the auditor requires.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Certificate:</label>
              <select
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white border border-white/10 focus:border-emerald-500/50 outline-none bg-black/80 transition-all font-mono"
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
              >
                {certificates.length === 0 ? (
                  <option value="">No certificates available (run scanner first)</option>
                ) : (
                  certificates.map((c) => (
                    <option key={c.certificateId} value={c.certificateId}>
                      {c.certificateId} — {c.walletAddress} ({c.outcome})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Recipient / Auditor Organization:
              </label>
              <input
                type="text"
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-emerald-500/50 outline-none bg-black/40 transition-all"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. DeFi Protocol Compliance Team, Bank Auditor"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Share Expiration Window:</label>
              <select
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white border border-white/10 focus:border-emerald-500/50 outline-none bg-black/80 transition-all"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              >
                <option value={1}>1 Day (Ephemeral Access)</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Recommended Standard)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days (Maximum Window)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Custom Access Code (Optional Passphrase):
              </label>
              <input
                type="text"
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-emerald-500/50 outline-none bg-black/40 transition-all font-mono"
                value={customAccessCode}
                onChange={(e) => setCustomAccessCode(e.target.value)}
                placeholder="Leave blank to auto-generate high-entropy code"
              />
            </div>
          </div>

          {/* Privacy & Selective Disclosure Checkboxes */}
          <div className="liquid-glass rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Selective Disclosure Permissions & Redaction Controls</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/[0.02] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-500 rounded"
                  checked={permissions.discloseOutcome}
                  onChange={(e) => setPermissions({ ...permissions, discloseOutcome: e.target.checked })}
                />
                <div>
                  <div className="text-xs font-semibold text-white">Disclose Outcome</div>
                  <div className="text-[11px] text-slate-400">APPROVED / REJECTED / INCONCLUSIVE certification status</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/[0.02] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-500 rounded"
                  checked={permissions.discloseRiskScore}
                  onChange={(e) => setPermissions({ ...permissions, discloseRiskScore: e.target.checked })}
                />
                <div>
                  <div className="text-xs font-semibold text-white">Disclose Risk Score</div>
                  <div className="text-[11px] text-slate-400">Quantitative risk metric (0 - 100 risk factor)</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/[0.02] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-500 rounded"
                  checked={permissions.discloseScopeAndHopDepth}
                  onChange={(e) => setPermissions({ ...permissions, discloseScopeAndHopDepth: e.target.checked })}
                />
                <div>
                  <div className="text-xs font-semibold text-white">Disclose Scope & Hop Depth</div>
                  <div className="text-[11px] text-slate-400">Verification depth (e.g. 2 Hops, 90-day time boundary)</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 bg-white/[0.02] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-500 rounded"
                  checked={permissions.discloseFindingsSummary}
                  onChange={(e) => setPermissions({ ...permissions, discloseFindingsSummary: e.target.checked })}
                />
                <div>
                  <div className="text-xs font-semibold text-white">Disclose Findings Summary</div>
                  <div className="text-[11px] text-slate-400">High-level risk categorizations without wallet identities</div>
                </div>
              </label>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40 cursor-pointer transition-all mt-1">
              <input
                type="checkbox"
                className="mt-0.5 accent-rose-500 rounded"
                checked={permissions.discloseRawCounterparties}
                onChange={(e) => setPermissions({ ...permissions, discloseRawCounterparties: e.target.checked })}
              />
              <div>
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Disclose Raw Counterparty Addresses (Not Recommended)
                </div>
                <div className="text-[11px] text-rose-300/80">
                  Reveals exact wallet addresses of counterparties. Leaving this unchecked preserves financial privacy.
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={handleCreateShare}
            disabled={creating || !selectedCertId}
            className="w-full py-3.5 px-6 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Lock size={16} />
            {creating ? 'Encrypting & Generating Secure Share Token...' : 'Encrypt & Generate Selective Disclosure Token'}
          </button>

          {/* Created Token Output */}
          {createdShareResult && (
            <div className="liquid-glass rounded-2xl p-6 border border-emerald-500/40 bg-emerald-500/5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Encrypted Selective Disclosure Share Ready!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provide both the Share ID and Access Code to the authorized auditor. The report payload is encrypted
                with AES-256-GCM authenticated encryption and stored under zero-knowledge access rules.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="liquid-glass rounded-xl p-4 border border-white/10 flex flex-col gap-1.5 bg-black/40">
                  <span className="text-[11px] text-slate-400 font-medium">Share ID</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs md:text-sm text-white font-semibold truncate">
                      {createdShareResult.share.shareId}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShareResult.share.shareId, 'shareId')}
                      className="p-1.5 rounded-lg liquid-glass hover:text-emerald-400 transition-colors text-slate-400"
                    >
                      {copiedField === 'shareId' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="liquid-glass rounded-xl p-4 border border-emerald-500/30 flex flex-col gap-1.5 bg-black/40">
                  <span className="text-[11px] text-slate-400 font-medium">Decryption Access Code</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm md:text-base text-emerald-400 font-bold tracking-wider truncate">
                      {createdShareResult.accessCode}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShareResult.accessCode, 'accessCode')}
                      className="p-1.5 rounded-lg liquid-glass hover:text-emerald-400 transition-colors text-slate-400"
                    >
                      {copiedField === 'accessCode' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setInspectShareId(createdShareResult.share.shareId);
                    setInspectAccessCode(createdShareResult.accessCode);
                    setActiveTab('inspect');
                  }}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold liquid-glass text-white hover:border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Unlock size={14} className="text-emerald-400" /> Open in Auditor Inspection Portal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Auditor Verification Portal */}
      {activeTab === 'inspect' && (
        <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Unlock size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Auditor Verification & Decryption Portal</h2>
              <p className="text-xs text-slate-400">
                Enter the client-provided Share ID and Access Code to decrypt the authorized compliance payload.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Share ID:</label>
              <input
                type="text"
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-emerald-500/50 outline-none bg-black/40 font-mono transition-all"
                value={inspectShareId}
                onChange={(e) => setInspectShareId(e.target.value)}
                placeholder="e.g. share_173136..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Access Code / Decryption Passphrase:</label>
              <input
                type="text"
                className="w-full liquid-glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 border border-white/10 focus:border-emerald-500/50 outline-none bg-black/40 font-mono transition-all"
                value={inspectAccessCode}
                onChange={(e) => setInspectAccessCode(e.target.value)}
                placeholder="Enter access passphrase or code"
              />
            </div>
          </div>

          <button
            onClick={handleInspect}
            disabled={inspecting}
            className="w-full py-3.5 px-6 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Unlock size={16} />
            {inspecting ? 'Decrypting Restricted Report...' : 'Decrypt & Inspect Selective Disclosure Report'}
          </button>

          {inspectError && (
            <div className="p-4 rounded-2xl liquid-glass border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{inspectError}</span>
            </div>
          )}

          {/* Decrypted Report Output */}
          {decryptedReport && (
            <div className="liquid-glass rounded-2xl p-6 border border-emerald-500/30 bg-black/40 flex flex-col gap-5 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="text-emerald-400 w-5 h-5" />
                  <span className="text-base font-bold text-white">Decrypted Compliance Evidence</span>
                </div>
                <span className="badge badge-approved text-xs px-3 py-1 rounded-full font-semibold">
                  Decrypted & Authenticated
                </span>
              </div>

              <div className="p-3.5 rounded-xl liquid-glass border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 leading-relaxed">
                {decryptedReport.confidentialityNotice ||
                  'Raw transaction history redacted under zero-knowledge selective disclosure.'}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                  <span className="text-slate-400 block mb-1">Certificate ID</span>
                  <span className="font-mono text-white font-semibold break-all">
                    {decryptedReport.certificateId}
                  </span>
                </div>

                <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                  <span className="text-slate-400 block mb-1">Verified Outcome</span>
                  <span
                    className={`inline-block font-semibold ${
                      decryptedReport.outcome === 'APPROVED'
                        ? 'text-emerald-400'
                        : decryptedReport.outcome === 'REJECTED'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {decryptedReport.outcome}
                  </span>
                </div>

                {decryptedReport.riskScore !== undefined && (
                  <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                    <span className="text-slate-400 block mb-1">Risk Score</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        decryptedReport.riskScore < 25 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {decryptedReport.riskScore} / 100
                    </span>
                  </div>
                )}

                {decryptedReport.hopDepth && (
                  <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                    <span className="text-slate-400 block mb-1">Verified Hop Depth</span>
                    <span className="text-white font-semibold">{decryptedReport.hopDepth} Hops</span>
                  </div>
                )}

                <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                  <span className="text-slate-400 block mb-1">Network</span>
                  <span className="text-teal-400 font-semibold">{decryptedReport.network}</span>
                </div>

                <div className="liquid-glass rounded-xl p-3 border border-white/5 bg-white/[0.02]">
                  <span className="text-slate-400 block mb-1">Issuer Authority</span>
                  <span className="text-white font-semibold truncate block">
                    {decryptedReport.issuerIdentity}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col gap-1.5">
                <span className="text-[11px] text-slate-400">Issuer Cryptographic Signature (Ed25519)</span>
                <span className="text-[11px] font-mono text-slate-300 break-all p-3 rounded-xl liquid-glass border border-white/10 bg-black/50 select-all">
                  {decryptedReport.digitalSignature}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Active Shares Manager */}
      {activeTab === 'manage' && (
        <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl flex flex-col gap-5 relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">Active Selective Disclosure Shares</h2>
                <p className="text-xs text-slate-400">
                  Manage granted auditor tokens, view validity dates, or instantly revoke access.
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass text-white/80 hover:text-white hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {shares.length > 0 ? (
            <div className="flex flex-col gap-3">
              {shares.map((share) => (
                <div
                  key={share.shareId}
                  className="liquid-glass rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between flex-wrap gap-4 bg-white/[0.01]"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-sm md:text-base">{share.recipientName}</span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                          share.status === 'ACTIVE'
                            ? 'badge badge-approved'
                            : share.status === 'EXPIRED'
                            ? 'badge badge-inconclusive'
                            : 'badge badge-rejected'
                        }`}
                      >
                        {share.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>
                        Share ID: <code className="text-white font-mono">{share.shareId}</code>
                      </span>
                      <span>•</span>
                      <span>
                        Target: <code className="text-emerald-400 font-mono">{share.walletAddress}</code>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Expires: {new Date(share.expiresAt).toLocaleDateString()}</span>
                    </div>

                    {share.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevokeShare(share.shareId)}
                        className="px-4 py-2 rounded-full text-xs font-semibold liquid-glass text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="liquid-glass rounded-2xl p-12 text-center text-slate-400 text-sm border border-dashed border-white/10">
              No selective disclosure share tokens created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
