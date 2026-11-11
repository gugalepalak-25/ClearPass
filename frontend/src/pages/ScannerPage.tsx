import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Award,
  Sparkles,
  ChevronRight,
  Layers,
  CheckCircle2,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useNearWallet } from '../wallet/NearWalletContext.js';
import { scanWallet, issueCertificate, fetchScenarios } from '../services/api.js';
import { AssessmentResult, DemoScenario, VerificationCertificate } from '../types/index.js';
import { TrustNotice } from '../components/TrustNotice.js';

interface ScannerPageProps {
  onNavigate: (tab: string) => void;
  onCertificateIssued?: (cert: VerificationCertificate) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onNavigate, onCertificateIssued }) => {
  const { accountId } = useNearWallet();
  const [targetAccount, setTargetAccount] = useState<string>(accountId || 'alice-clean-demo.testnet');
  const [hopDepth, setHopDepth] = useState<number>(2);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [includeAi, setIncludeAi] = useState<boolean>(true);
  const [scenarios, setScenarios] = useState<Record<string, DemoScenario>>({});

  const [scanning, setScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [issuing, setIssuing] = useState<boolean>(false);
  const [issuedCert, setIssuedCert] = useState<VerificationCertificate | null>(null);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (accountId && !selectedScenario) {
      setTargetAccount(accountId);
    }
  }, [accountId]);

  const handleScenarioSelect = (scenarioKey: string) => {
    setSelectedScenario(scenarioKey);
    const scen = scenarios[scenarioKey];
    if (scen) {
      setTargetAccount(scen.account);
    }
  };

  const handleStartScan = async () => {
    if (!targetAccount.trim()) {
      setScanError('Please enter a target NEAR account address.');
      return;
    }

    setScanError(null);
    setAssessment(null);
    setIssuedCert(null);
    setScanning(true);
    setScanStep(1);

    try {
      // Simulate stepped progression for visible feedback
      setTimeout(() => setScanStep(2), 500);
      setTimeout(() => setScanStep(3), 1100);
      setTimeout(() => setScanStep(4), 1700);

      const result = await scanWallet(
        targetAccount.trim(),
        hopDepth,
        selectedScenario || undefined,
        includeAi
      );

      setTimeout(() => {
        setScanStep(5);
        setTimeout(() => {
          setAssessment(result);
          setScanning(false);
        }, 400);
      }, 2100);
    } catch (err: any) {
      setScanError(err?.message || 'An error occurred during wallet scanning.');
      setScanning(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!assessment) return;
    setIssuing(true);
    try {
      const cert = await issueCertificate(assessment);
      setIssuedCert(cert);
      if (onCertificateIssued) {
        onCertificateIssued(cert);
      }
    } catch (err: any) {
      setScanError(err?.message || 'Failed to issue certificate.');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '6px' }}>
          Fund Risk Scanner
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Evaluate native NEAR and NEP-141 transfers across up to 3 transaction hops against known flagged entities.
        </p>
      </div>

      <TrustNotice />

      {/* Scanner Control Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0fdf4' }}>Assessment Parameters</h3>

        {/* Demo Scenario Selectors */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
            Quick Demonstration Scenarios:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            <button
              onClick={() => handleScenarioSelect('scenario_low_risk')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: selectedScenario === 'scenario_low_risk' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                border: selectedScenario === 'scenario_low_risk' ? '1px solid #10b981' : '1px solid var(--border-medium)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>Scenario 1: Low-Risk</span>
                <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>APPROVED</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Synthetic clean wallet within 3-hop scope</span>
            </button>

            <button
              onClick={() => handleScenarioSelect('scenario_flagged')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: selectedScenario === 'scenario_flagged' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                border: selectedScenario === 'scenario_flagged' ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>Scenario 2: Flagged</span>
                <span className="badge badge-rejected" style={{ fontSize: '0.65rem' }}>REJECTED</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Direct exposure to simulated mixer pool</span>
            </button>

            <button
              onClick={() => handleScenarioSelect('scenario_inconclusive')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: selectedScenario === 'scenario_inconclusive' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                border: selectedScenario === 'scenario_inconclusive' ? '1px solid #f59e0b' : '1px solid var(--border-medium)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>Scenario 3: Insufficient</span>
                <span className="badge badge-inconclusive" style={{ fontSize: '0.65rem' }}>INCONCLUSIVE</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Empty or unindexed transaction history</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid-2">
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Target NEAR Account:
            </label>
            <input
              type="text"
              className="input-field"
              value={targetAccount}
              onChange={(e) => {
                setTargetAccount(e.target.value);
                setSelectedScenario('');
              }}
              placeholder="e.g. account.testnet or demo account"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Hop Depth:
              </label>
              <select
                className="input-field"
                value={hopDepth}
                onChange={(e) => setHopDepth(Number(e.target.value))}
              >
                <option value={1}>1 Hop (Direct Interactions)</option>
                <option value={2}>2 Hops (Direct + Secondary)</option>
                <option value={3}>3 Hops (Deep Counterparty Path)</option>
              </select>
            </div>

            <div style={{ width: '130px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Network:
              </label>
              <div
                style={{
                  padding: '11px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#34d399',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                NEAR Testnet
              </div>
            </div>
          </div>
        </div>

        {/* AI Explanation toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="includeAi"
            checked={includeAi}
            onChange={(e) => setIncludeAi(e.target.checked)}
            style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
          />
          <label htmlFor="includeAi" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
            Include AI Risk Intelligence Explanation (Generates plain-language interpretation)
          </label>
        </div>

        {/* Submit */}
        <div>
          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            {scanning ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Scanning Wallet Activity...
              </>
            ) : (
              <>
                <Search size={18} /> Run Deterministic Risk Assessment
              </>
            )}
          </button>
        </div>

        {scanError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
            }}
          >
            {scanError}
          </div>
        )}
      </div>

      {/* Real-time Scanning Progress Visualizer */}
      {scanning && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0fdf4' }}>
            Risk Assessment in Progress
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: 1, label: 'Connecting to NEAR Testnet RPC & querying account state' },
              { step: 2, label: 'Normalizing Native NEAR and NEP-141 token transaction graph' },
              { step: 3, label: 'Cross-referencing counterparties against flagged risk dataset' },
              { step: 4, label: `Evaluating multi-hop exposure paths (depth: ${hopDepth} hops)` },
              { step: 5, label: 'Calculating deterministic risk score & compiling findings' },
            ].map((s) => {
              const isDone = scanStep > s.step;
              const isCurrent = scanStep === s.step;
              return (
                <div
                  key={s.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.88rem',
                    color: isDone ? '#34d399' : isCurrent ? '#f0fdf4' : '#64748b',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isDone
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isCurrent
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(148, 163, 184, 0.1)',
                      border: isDone
                        ? '1px solid #10b981'
                        : isCurrent
                        ? '1px solid #34d399'
                        : '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? <CheckCircle2 size={14} color="#10b981" /> : s.step}
                  </div>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assessment Results Card */}
      {assessment && (
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            border:
              assessment.outcome === 'APPROVED'
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : assessment.outcome === 'REJECTED'
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(245, 158, 11, 0.4)',
          }}
        >
          {/* Outcome Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                Assessment Result for <strong style={{ color: '#f0fdf4' }}>{assessment.walletAddress}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className={`badge ${
                    assessment.outcome === 'APPROVED'
                      ? 'badge-approved'
                      : assessment.outcome === 'REJECTED'
                      ? 'badge-rejected'
                      : 'badge-inconclusive'
                  }`}
                  style={{ fontSize: '0.95rem', padding: '6px 14px' }}
                >
                  {assessment.outcome === 'APPROVED' && <ShieldCheck size={18} />}
                  {assessment.outcome === 'REJECTED' && <AlertOctagon size={18} />}
                  {assessment.outcome === 'INCONCLUSIVE' && <HelpCircle size={18} />}
                  {assessment.outcome}
                </span>

                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Risk Score:{' '}
                  <strong
                    style={{
                      color:
                        assessment.riskScore < 25
                          ? '#34d399'
                          : assessment.riskScore >= 50
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {assessment.riskScore} / 100
                  </strong>
                </span>
              </div>
            </div>

            {/* Issue Certificate Action */}
            <div>
              {issuedCert ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-approved" style={{ padding: '6px 12px' }}>
                    <CheckCircle2 size={14} /> Certificate Issued
                  </span>
                  <button onClick={() => onNavigate('certificates')} className="btn btn-secondary btn-sm">
                    View in Registry
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleIssueCertificate}
                  disabled={issuing}
                  className="btn btn-primary"
                  style={{ padding: '10px 18px' }}
                >
                  <Award size={16} />
                  {issuing ? 'Signing Certificate...' : 'Issue Signed Verification Certificate'}
                </button>
              )}
            </div>
          </div>

          {/* Explanation Summary */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              Deterministic Engine Decision:
            </div>
            {assessment.summaryExplanation}
          </div>

          {/* AI Risk Explanation (if included) */}
          {assessment.aiExplanation && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#34d399' }}>
                <Sparkles size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>AI Risk Intelligence Analysis</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {assessment.aiExplanation}
              </div>
            </div>
          )}

          {/* Findings & Risk Factors Table */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f0fdf4', marginBottom: '12px' }}>
              Identified Risk Factors ({assessment.findings.length})
            </h4>

            {assessment.findings.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Indicator</th>
                      <th style={{ padding: '8px 10px' }}>Severity</th>
                      <th style={{ padding: '8px 10px' }}>Hop Distance</th>
                      <th style={{ padding: '8px 10px' }}>Counterparty</th>
                      <th style={{ padding: '8px 10px' }}>Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.findings.map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', color: '#f0fdf4' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{f.title}</td>
                        <td style={{ padding: '10px' }}>
                          <span
                            className={`badge ${
                              f.severity === 'CRITICAL' || f.severity === 'HIGH'
                                ? 'badge-rejected'
                                : 'badge-inconclusive'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{f.hopDistance === 0 ? 'Direct Match' : `${f.hopDistance} Hop`}</td>
                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {f.involvedAddress || 'N/A'}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#f87171' }}>
                          +{f.penaltyPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontSize: '0.88rem',
                }}
              >
                No risk indicators identified within {assessment.scope.maxHopDepth} hops.
              </div>
            )}
          </div>

          {/* Assessment Scope Metadata */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '14px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}
          >
            <div>
              <span>Risk List Version:</span>{' '}
              <strong style={{ color: '#f0fdf4' }}>{assessment.riskListVersion}</strong>
            </div>
            <div>
              <span>Evaluated Transactions:</span>{' '}
              <strong style={{ color: '#f0fdf4' }}>{assessment.scope.evaluatedTxCount}</strong>
            </div>
            <div>
              <span>Data Completeness:</span>{' '}
              <strong style={{ color: '#f0fdf4' }}>{assessment.scope.dataCompleteness}</strong>
            </div>
            <div>
              <span>Data Source:</span>{' '}
              <strong style={{ color: '#f0fdf4' }}>{assessment.scope.dataSource}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

