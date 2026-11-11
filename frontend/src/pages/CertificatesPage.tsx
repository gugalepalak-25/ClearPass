import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Users,
  Download,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { VerificationCertificate } from '../types/index.js';
import {
  fetchCertificates,
  verifyCertificateOnServer,
  revokeCertificateOnServer,
} from '../services/api.js';

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

  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const [revoking, setRevoking] = useState<boolean>(false);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '4px' }}>
            Verification Certificate Registry
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Cryptographically signed and on-chain verifiable proof records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => loadCertificates()} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => onNavigate('scanner')} className="btn btn-primary btn-sm">
            <Search size={14} /> Scan New Wallet
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: filter === tab.id ? 'var(--border-medium)' : 'var(--bg-card)',
              color: filter === tab.id ? '#34d399' : '#94a3b8',
              border: filter === tab.id ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Layout: List & Selected Certificate Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
        {/* Certificate List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '720px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1' }}>
            Certificates ({filtered.length})
          </h3>

          {filtered.length > 0 ? (
            filtered.map((cert) => {
              const isSelected = selectedCert?.certificateId === cert.certificateId;
              const isExpired = new Date(cert.expiryTimestamp) < new Date();
              return (
                <div
                  key={cert.certificateId}
                  onClick={() => {
                    setSelectedCert(cert);
                    setVerificationResult(null);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                    border: isSelected ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      className={`badge ${
                        cert.revoked
                          ? 'badge-rejected'
                          : cert.outcome === 'APPROVED'
                          ? 'badge-approved'
                          : cert.outcome === 'REJECTED'
                          ? 'badge-rejected'
                          : 'badge-inconclusive'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {cert.revoked ? 'REVOKED' : cert.outcome}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(cert.assessmentTimestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f0fdf4' }}>
                    {cert.walletAddress}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Score: {cert.riskScore}/100</span>
                    <span>{cert.hopDepth} Hops</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 12px', color: '#64748b', fontSize: '0.85rem' }}>
              No certificates found matching this filter.
            </div>
          )}
        </div>

        {/* Selected Certificate Detail View */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedCert ? (
            <>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>
                    Verification Certificate
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0fdf4' }}>
                    {selectedCert.certificateId}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleVerify(selectedCert.certificateId)}
                    disabled={verifying}
                    className="btn btn-primary btn-sm"
                  >
                    <ShieldCheck size={14} /> {verifying ? 'Verifying...' : 'Verify Cryptographic Proof'}
                  </button>

                  <button
                    onClick={() => handleExportJson(selectedCert)}
                    className="btn btn-secondary btn-sm"
                    title="Export raw JSON"
                  >
                    <Download size={14} />
                  </button>

                  {!selectedCert.revoked && (
                    <button
                      onClick={() => setShowRevokeModal(true)}
                      className="btn btn-danger btn-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Verification Live Status Banner */}
              {verificationResult && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: verificationResult.isValid
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    border: verificationResult.isValid
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    color: verificationResult.isValid ? '#34d399' : '#f87171',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {verificationResult.isValid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      Status: {verificationResult.status} (Valid:{' '}
                      {verificationResult.isValid ? 'YES' : 'NO'})
                    </div>
                    <div>{verificationResult.reason}</div>
                  </div>
                </div>
              )}

              {/* Metadata Key-Value Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Subject Account</span>
                  <span style={{ fontWeight: 600, color: '#f0fdf4' }}>{selectedCert.walletAddress}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Outcome</span>
                  <span
                    className={`badge ${
                      selectedCert.revoked
                        ? 'badge-rejected'
                        : selectedCert.outcome === 'APPROVED'
                        ? 'badge-approved'
                        : selectedCert.outcome === 'REJECTED'
                        ? 'badge-rejected'
                        : 'badge-inconclusive'
                    }`}
                  >
                    {selectedCert.revoked ? 'REVOKED' : selectedCert.outcome}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Risk Score</span>
                  <span style={{ fontWeight: 700, color: selectedCert.riskScore < 25 ? '#34d399' : '#f87171' }}>
                    {selectedCert.riskScore} / 100
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Assessment Hop Depth</span>
                  <span style={{ color: '#f0fdf4' }}>{selectedCert.hopDepth} Hops</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Issued Timestamp</span>
                  <span style={{ color: '#cbd5e1' }}>
                    {new Date(selectedCert.assessmentTimestamp).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Expiration</span>
                  <span style={{ color: '#cbd5e1' }}>
                    {new Date(selectedCert.expiryTimestamp).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Risk List Version</span>
                  <span style={{ color: '#cbd5e1' }}>{selectedCert.riskListVersion}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Network</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{selectedCert.network}</span>
                </div>
              </div>

              {/* Cryptographic Signature & Hash Block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
                  Cryptographic Integrity & Digital Signature
                </h4>

                {/* SHA-256 Hash */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
                    <span>Canonical SHA-256 Hash</span>
                    <button
                      onClick={() => handleCopy(selectedCert.certHash, 'hash')}
                      style={{ background: 'transparent', color: '#94a3b8' }}
                    >
                      {copiedField === 'hash' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: '#34d399', wordBreak: 'break-all' }}>
                    {selectedCert.certHash}
                  </div>
                </div>

                {/* Ed25519 Signature */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#64748b' }}>
                    <span>Ed25519 Issuer Signature</span>
                    <button
                      onClick={() => handleCopy(selectedCert.digitalSignature, 'sig')}
                      style={{ background: 'transparent', color: '#94a3b8' }}
                    >
                      {copiedField === 'sig' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1', wordBreak: 'break-all' }}>
                    {selectedCert.digitalSignature}
                  </div>
                </div>

                {/* Attestation Reference Note */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: '#f0fdf4', display: 'block', marginBottom: '2px' }}>
                    Attestation Scope Notice
                  </strong>
                  {selectedCert.attestationReference?.note ||
                    'Cryptographically signed by authorized issuer key. Standard digital signature verification.'}
                </div>
              </div>

              {/* Share With Auditor Action */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    if (onSelectShareCertificate) {
                      onSelectShareCertificate(selectedCert.certificateId);
                    }
                    onNavigate('auditor');
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  <Users size={16} /> Share With Auditor (Selective Disclosure)
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 12px', color: '#64748b' }}>
              Select a certificate from the left list to view details.
            </div>
          )}
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && selectedCert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>
              Revoke Certificate
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Revoking will permanently flag <strong>{selectedCert.certificateId}</strong> as REVOKED in the
              ClearPass registry and on-chain records.
            </p>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Revocation Reason:
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Key migration, wallet compromise, or requested by holder"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="btn btn-danger btn-sm"
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

