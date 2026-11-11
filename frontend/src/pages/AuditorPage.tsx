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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '4px' }}>
          Auditor Portal & Selective Disclosure
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Share verifiable compliance evidence with authorized auditors without exposing your complete wallet history.
        </p>
      </div>

      <TrustNotice />

      {/* Navigation Mode Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('create')}
          className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Lock size={16} /> 1. Create Selective Disclosure Share
        </button>

        <button
          onClick={() => setActiveTab('inspect')}
          className={`btn ${activeTab === 'inspect' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Unlock size={16} /> 2. Auditor Verification Portal
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={16} /> 3. Active Shares ({shares.length})
        </button>
      </div>

      {/* Mode 1: Create Selective Disclosure Share */}
      {activeTab === 'create' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0fdf4' }}>
            Generate Restricted Share Request
          </h3>

          <div className="grid-2">
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Select Certificate:
              </label>
              <select
                className="input-field"
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
              >
                {certificates.map((c) => (
                  <option key={c.certificateId} value={c.certificateId}>
                    {c.certificateId} — {c.walletAddress} ({c.outcome})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Recipient / Auditor Organization:
              </label>
              <input
                type="text"
                className="input-field"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. DeFi Protocol Compliance Team, Bank Auditor"
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Share Expiration:
              </label>
              <select
                className="input-field"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Recommended)</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Custom Access Code (Optional):
              </label>
              <input
                type="text"
                className="input-field"
                value={customAccessCode}
                onChange={(e) => setCustomAccessCode(e.target.value)}
                placeholder="Leave blank to auto-generate secure code"
              />
            </div>
          </div>

          {/* Privacy & Selective Disclosure Checkboxes */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '10px' }}>
              Selective Disclosure Permissions:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={permissions.discloseOutcome}
                  onChange={(e) => setPermissions({ ...permissions, discloseOutcome: e.target.checked })}
                  style={{ accentColor: '#10b981' }}
                />
                Disclose Assessment Outcome (APPROVED / REJECTED / INCONCLUSIVE)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={permissions.discloseRiskScore}
                  onChange={(e) => setPermissions({ ...permissions, discloseRiskScore: e.target.checked })}
                  style={{ accentColor: '#10b981' }}
                />
                Disclose Quantitative Risk Score (0 - 100)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={permissions.discloseScopeAndHopDepth}
                  onChange={(e) => setPermissions({ ...permissions, discloseScopeAndHopDepth: e.target.checked })}
                  style={{ accentColor: '#10b981' }}
                />
                Disclose Assessment Scope & Hop Depth (e.g. 2 Hops, 90 days window)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f87171' }}>
                <input
                  type="checkbox"
                  checked={permissions.discloseRawCounterparties}
                  onChange={(e) => setPermissions({ ...permissions, discloseRawCounterparties: e.target.checked })}
                  style={{ accentColor: '#ef4444' }}
                />
                <span>
                  Disclose Raw Counterparty Addresses (<strong>Not Recommended</strong> — Leaves private history exposed)
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCreateShare}
            disabled={creating}
            className="btn btn-primary"
            style={{ padding: '12px' }}
          >
            <Lock size={16} /> {creating ? 'Encrypting & Generating Share...' : 'Encrypt & Generate Selective Disclosure Token'}
          </button>

          {/* Created Token Output */}
          {createdShareResult && (
            <div
              style={{
                marginTop: '12px',
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span>Encrypted Selective Disclosure Share Ready!</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Provide the Share ID and Access Code to the authorized auditor. The report is encrypted with AES-256-GCM.
              </p>

              <div className="grid-2">
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Share ID</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', color: '#f0fdf4' }}>
                      {createdShareResult.share.shareId}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShareResult.share.shareId, 'shareId')}
                      style={{ background: 'transparent', color: '#94a3b8' }}
                    >
                      {copiedField === 'shareId' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Access Code</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                      {createdShareResult.accessCode}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShareResult.accessCode, 'accessCode')}
                      style={{ background: 'transparent', color: '#94a3b8' }}
                    >
                      {copiedField === 'accessCode' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setInspectShareId(createdShareResult.share.shareId);
                    setInspectAccessCode(createdShareResult.accessCode);
                    setActiveTab('inspect');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <Unlock size={14} /> Open in Auditor Inspection Portal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Auditor Verification Portal */}
      {activeTab === 'inspect' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f0fdf4' }}>
            Auditor Inspection Portal
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Enter the Share ID and Access Code provided by the client to decrypt and review the selective disclosure report.
          </p>

          <div className="grid-2">
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Share ID:
              </label>
              <input
                type="text"
                className="input-field"
                value={inspectShareId}
                onChange={(e) => setInspectShareId(e.target.value)}
                placeholder="e.g. share_173136..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Access Code:
              </label>
              <input
                type="text"
                className="input-field"
                value={inspectAccessCode}
                onChange={(e) => setInspectAccessCode(e.target.value)}
                placeholder="Enter access passphrase or code"
              />
            </div>
          </div>

          <button
            onClick={handleInspect}
            disabled={inspecting}
            className="btn btn-primary"
            style={{ padding: '12px' }}
          >
            <Unlock size={16} /> {inspecting ? 'Decrypting Report...' : 'Decrypt & Inspect Selective Disclosure Report'}
          </button>

          {inspectError && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              {inspectError}
            </div>
          )}

          {/* Decrypted Report Output */}
          {decryptedReport && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0fdf4' }}>
                  Decrypted Compliance Evidence
                </span>
                <span className="badge badge-approved">Decrypted & Verified</span>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.82rem',
                  color: '#34d399',
                }}
              >
                {decryptedReport.confidentialityNotice || 'Raw transaction history redacted under zero-knowledge selective disclosure.'}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Certificate ID</span>
                  <span style={{ fontWeight: 600, color: '#f0fdf4', fontFamily: 'var(--font-mono)' }}>
                    {decryptedReport.certificateId}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Verified Outcome</span>
                  <span
                    className={`badge ${
                      decryptedReport.outcome === 'APPROVED'
                        ? 'badge-approved'
                        : decryptedReport.outcome === 'REJECTED'
                        ? 'badge-rejected'
                        : 'badge-inconclusive'
                    }`}
                  >
                    {decryptedReport.outcome}
                  </span>
                </div>

                {decryptedReport.riskScore !== undefined && (
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Risk Score</span>
                    <span style={{ fontWeight: 700, color: decryptedReport.riskScore < 25 ? '#34d399' : '#f87171' }}>
                      {decryptedReport.riskScore} / 100
                    </span>
                  </div>
                )}

                {decryptedReport.hopDepth && (
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Verified Hop Depth</span>
                    <span style={{ color: '#f0fdf4' }}>{decryptedReport.hopDepth} Hops</span>
                  </div>
                )}

                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Network</span>
                  <span style={{ color: '#34d399' }}>{decryptedReport.network}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Issuer Authority</span>
                  <span style={{ color: '#f0fdf4' }}>{decryptedReport.issuerIdentity}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Issuer Digital Signature
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', wordBreak: 'break-all' }}>
                  {decryptedReport.digitalSignature}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Active Shares Manager */}
      {activeTab === 'manage' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0fdf4' }}>
              Active Selective Disclosure Shares
            </h3>
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {shares.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shares.map((share) => (
                <div
                  key={share.shareId}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#f0fdf4', fontSize: '0.9rem' }}>
                        {share.recipientName}
                      </span>
                      <span
                        className={`badge ${
                          share.status === 'ACTIVE'
                            ? 'badge-approved'
                            : share.status === 'EXPIRED'
                            ? 'badge-inconclusive'
                            : 'badge-rejected'
                        }`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {share.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Share ID: <code style={{ color: '#cbd5e1' }}>{share.shareId}</code> | Target:{' '}
                      <code style={{ color: '#34d399' }}>{share.walletAddress}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Expires: {new Date(share.expiresAt).toLocaleDateString()}
                    </div>
                    {share.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevokeShare(share.shareId)}
                        className="btn btn-danger btn-sm"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 12px', color: '#64748b' }}>
              No selective disclosure share tokens created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

