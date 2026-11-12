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
  Zap,
} from 'lucide-react';
import { useNearWallet } from '../wallet/NearWalletContext.js';
import { scanWallet, issueCertificate, fetchScenarios } from '../services/api.js';
import { AssessmentResult, DemoScenario, VerificationCertificate } from '../types/index.js';
import { TrustNotice } from '../components/TrustNotice.js';

interface ScannerPageProps {
  onNavigate: (tab: string) => void;
  onCertificateIssued?: (cert: VerificationCertificate) => void;
  initialAccount?: string;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onNavigate, onCertificateIssued, initialAccount }) => {
  const { accountId } = useNearWallet();
  const [targetAccount, setTargetAccount] = useState<string>(initialAccount || accountId || 'alice-clean-demo.testnet');
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
    if (initialAccount) {
      setTargetAccount(initialAccount);
    }
  }, [initialAccount]);

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
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Fund Risk Scanner
        </h2>
        <p className="text-slate-400 text-xs md:text-sm">
          Evaluate native NEAR and NEP-141 transfers across up to 3 transaction hops against known flagged entities.
        </p>
      </div>

      <TrustNotice />

      {/* Scanner Control Panel */}
      <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col gap-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Assessment Parameters</span>
        </h3>

        {/* Demo Scenario Selectors */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2.5">
            Quick Demonstration Scenarios:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleScenarioSelect('scenario_low_risk')}
              className={`flex flex-col gap-1 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                selectedScenario === 'scenario_low_risk'
                  ? 'bg-purple-500/15 border border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Clean Merchant</span>
                <span className="badge badge-approved text-[10px]">Approved</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono truncate">alice-clean-demo.testnet</span>
              <span className="text-[10px] text-purple-300">0 hops to risk entities</span>
            </button>

            <button
              onClick={() => handleScenarioSelect('scenario_direct_risk')}
              className={`flex flex-col gap-1 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                selectedScenario === 'scenario_direct_risk'
                  ? 'bg-rose-500/15 border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Direct Exposure</span>
                <span className="badge badge-rejected text-[10px]">Rejected</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono truncate">flagged-mixer.testnet</span>
              <span className="text-[10px] text-rose-400/80">Direct sanctions exposure</span>
            </button>

            <button
              onClick={() => handleScenarioSelect('scenario_multi_hop_risk')}
              className={`flex flex-col gap-1 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                selectedScenario === 'scenario_multi_hop_risk'
                  ? 'bg-amber-500/15 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">2-Hop Sybil</span>
                <span className="badge badge-inconclusive text-[10px]">High Risk</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono truncate">charlie-hop2.testnet</span>
              <span className="text-[10px] text-amber-400/80">Indirect 2-hop exposure</span>
            </button>
          </div>
        </div>

        {/* Target Account Input & Hop Depth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Target NEAR Account:
            </label>
            <input
              type="text"
              value={targetAccount}
              onChange={(e) => {
                setTargetAccount(e.target.value);
                setSelectedScenario('');
              }}
              placeholder="e.g. user.testnet or account.near"
              className="input-field font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Traversal Hop Depth:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => setHopDepth(h)}
                  className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                    hopDepth === h
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  {h} {h === 1 ? 'Hop' : 'Hops'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Options & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={includeAi}
              onChange={(e) => setIncludeAi(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
            />
            <span>Include AI Risk Intelligence & Natural Language Explanation</span>
          </label>

          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="btn btn-primary text-xs md:text-sm py-2.5 px-6 shrink-0"
          >
            {scanning ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Evaluating Blockchain Graph...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Execute Fund Risk Assessment</span>
              </>
            )}
          </button>
        </div>

        {scanError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}
      </div>

      {/* Real-time Scanning Progress Visualizer */}
      {scanning && (
        <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-purple-500/30 bg-purple-500/[0.02] shadow-2xl flex flex-col gap-4 animate-fade-in">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
            <span>Risk Assessment in Progress</span>
          </h4>
          <div className="flex flex-col gap-3">
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
                  className={`flex items-center gap-3 text-xs md:text-sm transition-colors ${
                    isDone ? 'text-purple-300 font-medium' : isCurrent ? 'text-white font-medium' : 'text-slate-500'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      isDone
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                        : isCurrent
                        ? 'bg-purple-500/10 text-purple-200 border border-purple-400/80 animate-pulse'
                        : 'bg-white/[0.03] text-slate-500 border border-white/10'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={13} /> : s.step}
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
          className={`liquid-glass rounded-3xl p-6 md:p-8 border shadow-2xl flex flex-col gap-6 ${
            assessment.outcome === 'APPROVED'
              ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
              : assessment.outcome === 'REJECTED'
              ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
              : 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
          }`}
        >
          {/* Outcome Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="text-xs text-slate-400 mb-1">
                Assessment Result for <strong className="text-white font-mono">{assessment.walletAddress}</strong>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`badge ${
                    assessment.outcome === 'APPROVED'
                      ? 'badge-approved'
                      : assessment.outcome === 'REJECTED'
                      ? 'badge-rejected'
                      : 'badge-inconclusive'
                  } text-xs px-3.5 py-1.5`}
                >
                  {assessment.outcome === 'APPROVED' && <ShieldCheck size={16} />}
                  {assessment.outcome === 'REJECTED' && <AlertOctagon size={16} />}
                  {assessment.outcome === 'INCONCLUSIVE' && <HelpCircle size={16} />}
                  <span>{assessment.outcome}</span>
                </span>

                <span className="text-xs text-slate-400">
                  Risk Score:{' '}
                  <strong
                    className={`font-mono text-sm ${
                      assessment.riskScore < 25
                        ? 'text-emerald-400'
                        : assessment.riskScore >= 50
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {assessment.riskScore} / 100
                  </strong>
                </span>
              </div>
            </div>

            {/* Issue Certificate Action */}
            <div>
              {issuedCert ? (
                <div className="flex items-center gap-3">
                  <span className="badge badge-approved text-xs py-1.5 px-3">
                    <CheckCircle2 size={14} /> Certificate Issued
                  </span>
                  <button onClick={() => onNavigate('certificates')} className="btn btn-secondary btn-sm text-xs">
                    View in Registry
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleIssueCertificate}
                  disabled={issuing}
                  className="btn btn-primary text-xs py-2.5 px-5"
                >
                  <Award size={15} />
                  <span>{issuing ? 'Signing Certificate...' : 'Issue Signed Verification Certificate'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Explanation Summary */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs md:text-sm text-slate-300 leading-relaxed">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Deterministic Engine Decision:
            </div>
            {assessment.summaryExplanation}
          </div>

          {/* AI Risk Explanation */}
          {assessment.aiExplanation && (
            <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/25">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">AI Risk Intelligence Analysis</span>
              </div>
              <div className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {assessment.aiExplanation}
              </div>
            </div>
          )}

          {/* Findings & Risk Factors Table */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">
              Identified Risk Factors ({assessment.findings.length})
            </h4>

            {assessment.findings.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.01]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 bg-white/[0.02]">
                      <th className="p-3">Indicator</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Hop Distance</th>
                      <th className="p-3">Counterparty</th>
                      <th className="p-3">Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.findings.map((f, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-medium text-white">{f.title}</td>
                        <td className="p-3">
                          <span
                            className={`badge ${
                              f.severity === 'CRITICAL' || f.severity === 'HIGH'
                                ? 'badge-rejected'
                                : 'badge-inconclusive'
                            } text-[10px]`}
                          >
                            {f.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{f.hopDistance === 0 ? 'Direct Match' : `${f.hopDistance} Hop`}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{f.involvedAddress || 'N/A'}</td>
                        <td className="p-3 font-mono font-bold text-rose-400">+{f.penaltyPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20 text-emerald-400 text-xs">
                No risk indicators identified within {assessment.scope.maxHopDepth} hops.
              </div>
            )}
          </div>

          {/* Assessment Scope Metadata */}
          <div className="flex flex-wrap gap-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-[11px] text-slate-400 font-mono">
            <div>
              <span>Risk List:</span> <strong className="text-white">{assessment.riskListVersion}</strong>
            </div>
            <div>
              <span>Evaluated Txs:</span> <strong className="text-white">{assessment.scope.evaluatedTxCount}</strong>
            </div>
            <div>
              <span>Completeness:</span> <strong className="text-white">{assessment.scope.dataCompleteness}</strong>
            </div>
            <div>
              <span>Source:</span> <strong className="text-white">{assessment.scope.dataSource}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
