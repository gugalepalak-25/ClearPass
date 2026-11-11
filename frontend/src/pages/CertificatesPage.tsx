import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Share2,
  RefreshCw,
  ExternalLink,
  Search,
  Key,
  X,
  FileText,
} from 'lucide-react';
import {
  fetchCertificates,
  verifyCertificateOnServer,
  revokeCertificateOnServer,
} from '../services/api.js';
import { VerificationCertificate } from '../types/index.js';

interface CertificatesPageProps {
  onNavigate: (tab: string) => void;
  onSelectShareCertificate?: (certId: string) => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({
  onNavigate,
  onSelectShareCertificate,
}) => {
  const [certificates, setCertificates] = useState<VerificationCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedCert, setSelectedCert] = useState<VerificationCertificate | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await fetchCertificates();
      setCertificates(data);
      if (data.length > 0 && !selectedCert) {
        setSelectedCert(data[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (certId: string) => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const result = await verifyCertificateOnServer(certId);
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({
        isValid: false,
        status: 'ERROR',
        reason: err?.message || 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedCert) return;
    setRevoking(true);
    try {
      const updated = await revokeCertificateOnServer(
        selectedCert.certificateId,
        revokeReason || 'Revoked by certificate holder.'
      );
      setSelectedCert(updated);
      setCertificates((prev) =>
        prev.map((c) => (c.certificateId === updated.certificateId ? updated : c))
      );
      setShowRevokeModal(false);
      setRevokeReason('');
    } catch (err: any) {
      alert(`Revocation error: ${err?.message || 'Failed to revoke'}`);
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportJson = (cert: VerificationCertificate) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cert, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${cert.certificateId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = certificates.filter((c) => {
    if (filter === 'APPROVED') return c.outcome === 'APPROVED' && !c.revoked;
    if (filter === 'REJECTED') return c.outcome === 'REJECTED';
    if (filter === 'INCONCLUSIVE') return c.outcome === 'INCONCLUSIVE';
    if (filter === 'REVOKED') return c.revoked;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
            Verification Certificate Registry
          </h2>
          <p className="text-slate-400 text-xs md:text-sm">
            Cryptographically signed and on-chain verifiable proof records.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => loadCertificates()} className="btn btn-secondary btn-sm text-xs">
            <RefreshCw size={13} /> <span>Refresh</span>
          </button>
          <button onClick={() => onNavigate('scanner')} className="btn btn-primary btn-sm text-xs">
            <Search size={13} /> <span>Scan New Wallet</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `All (${certificates.length})` },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'INCONCLUSIVE', label: 'Inconclusive' },
          { id: 'REVOKED', label: 'Revoked' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Layout: List & Selected Certificate Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate List (1 col) */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col gap-3 max-h-[720px] overflow-y-auto">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Certificates ({filtered.length})
          </h3>

          {filtered.length > 0 ? (
            filtered.map((cert) => {
              const isSelected = selectedCert?.certificateId === cert.certificateId;
              return (
                <div
                  key={cert.certificateId}
                  onClick={() => {
                    setSelectedCert(cert);
                    setVerificationResult(null);
                  }}
                  className={`p-3.5 rounded-2xl cursor-pointer flex flex-col gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`badge ${
                        cert.revoked
                          ? 'badge-rejected'
                          : cert.outcome === 'APPROVED'
                          ? 'badge-approved'
                          : cert.outcome === 'REJECTED'
                          ? 'badge-rejected'
                          : 'badge-inconclusive'
                      } text-[10px]`}
                    >
                      {cert.revoked ? 'REVOKED' : cert.outcome}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(cert.assessmentTimestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="font-semibold text-xs md:text-sm text-white font-mono truncate">
                    {cert.walletAddress}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                    <span>Score: <strong className={cert.riskScore < 25 ? 'text-emerald-400' : 'text-rose-400'}>{cert.riskScore}/100</strong></span>
                    <span>{cert.hopDepth} Hops</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No certificates found matching this filter.
            </div>
          )}
        </div>

        {/* Selected Certificate Detail View (2 cols) */}
        <div className="lg:col-span-2 liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-6">
          {selectedCert ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-white/10">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Verification Certificate Record</div>
                  <div className="text-base md:text-lg font-bold font-mono text-white break-all">
                    {selectedCert.certificateId}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleVerify(selectedCert.certificateId)}
                    disabled={verifying}
                    className="btn btn-primary text-xs py-2 px-4"
                  >
                    <ShieldCheck size={14} />
                    <span>{verifying ? 'Verifying...' : 'Verify Cryptographic Proof'}</span>
                  </button>

                  <button
                    onClick={() => handleExportJson(selectedCert)}
                    className="btn btn-secondary text-xs py-2 px-3"
                    title="Export JSON"
                  >
                    <Download size={14} />
                  </button>

                  {!selectedCert.revoked && (
                    <button
                      onClick={() => setShowRevokeModal(true)}
                      className="btn btn-danger text-xs py-2 px-3"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Verification Live Status Banner */}
              {verificationResult && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 text-xs md:text-sm ${
                    verificationResult.isValid
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="mt-0.5">
                    {verificationResult.isValid ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertOctagon size={18} className="text-rose-400" />
                    )}
                  </div>
                  <div>
                    <strong className="block font-semibold mb-0.5">
                      {verificationResult.isValid ? 'Cryptographic Proof Valid' : 'Verification Unsuccessful'}
                    </strong>
                    <span className="text-slate-300 text-xs">
                      {verificationResult.reason || 'Ed25519 signature and on-chain record match verified issuer.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Certificate Key-Value Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">Evaluated Account</span>
                  <span className="text-white font-mono font-semibold break-all">{selectedCert.walletAddress}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">Assessment Date</span>
                  <span className="text-white font-mono">{new Date(selectedCert.assessmentTimestamp).toLocaleString()}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">Expiry Date</span>
                  <span className="text-white font-mono">{new Date(selectedCert.expiryTimestamp).toLocaleDateString()}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">Risk Score</span>
                  <span className={`text-base font-bold font-mono ${selectedCert.riskScore < 25 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedCert.riskScore}/100
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">Traversal Scope</span>
                  <span className="text-white font-mono">{selectedCert.hopDepth} Max Hops</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                  <span className="text-slate-400 block mb-1">On-Chain Anchor</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {selectedCert.onChainTxHash ? 'Stored on NEAR' : 'Ready to Anchor'}
                  </span>
                </div>
              </div>

              {/* Cryptographic Proof Details */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Key size={14} className="text-emerald-400" />
                  <span>Ed25519 Cryptographic Proof Details</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-black/40">
                    <span className="text-slate-400 text-[11px]">Issuer Public Key:</span>
                    <span className="text-emerald-300 text-[11px] truncate max-w-[280px]">
                      {selectedCert.issuerPublicKey}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-black/40">
                    <span className="text-slate-400 text-[11px]">Digital Signature:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[280px]">
                      {selectedCert.digitalSignature}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded-xl bg-black/40">
                    <span className="text-slate-400 text-[11px]">Certificate Hash:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[280px]">
                      {selectedCert.certHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selective Disclosure Action */}
              <div className="pt-2 flex items-center justify-between">
                {onSelectShareCertificate && (
                  <button
                    onClick={() => onSelectShareCertificate(selectedCert.certificateId)}
                    className="btn btn-primary text-xs py-2 px-5"
                  >
                    <Share2 size={14} />
                    <span>Share with Auditor (Selective Disclosure)</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a certificate from the left registry list to view detailed proofs.
            </div>
          )}
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="liquid-glass rounded-3xl p-6 w-full max-w-md border border-rose-500/30 bg-black/95 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-rose-400">Revoke Verification Certificate</h3>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to revoke certificate{' '}
              <strong className="text-white font-mono">{selectedCert.certificateId}</strong>? Once revoked, external DeFi applications will mark this certificate as invalid.
            </p>

            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason for revocation (e.g. key compromise, new compliance policy)..."
              className="input-field text-xs h-20 resize-none"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="btn btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="btn btn-danger text-xs py-2 px-4"
              >
                {revoking ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
