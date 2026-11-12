import crypto from 'node:crypto';
import { AssessmentResult, RiskFinding, RiskOutcome, AssessmentScope } from '../types/index.js';
import { loadRiskData, findFlaggedEntity } from './flagged-data.js';
import { fetchWalletHistory } from './near-rpc.js';
import { watchToken, loadEllipticBlocklist } from './real-data.js';

export async function assessWalletRisk(
  walletAddress: string,
  hopDepth: number = 2,
  scenarioOverride?: string
): Promise<AssessmentResult> {
  const scanId = `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const normalizedAddress = walletAddress.toLowerCase().trim();
  const clampedHopDepth = Math.max(1, Math.min(3, hopDepth));
  const riskData = loadRiskData();
  const elliptic = loadEllipticBlocklist();
  // The version that goes into certificates names BOTH lists, so a pass shows exactly what it was checked against.
  const riskListVersion = elliptic ? `${riskData.version}+elliptic-${elliptic.version}` : riskData.version;

  // 1. Fetch wallet data (via NEAR RPC or labelled Demo Scenario)
  const rpcData = await fetchWalletHistory(normalizedAddress, clampedHopDepth, scenarioOverride);

  const findings: RiskFinding[] = [];
  let calculatedScore = 0;
  let outcome: RiskOutcome = 'APPROVED';

  // 2. Direct Address Sanctions / Flag Check
  const directFlag = findFlaggedEntity(normalizedAddress);
  if (directFlag) {
    findings.push({
      code: 'DIRECT_FLAGGED_ENTITY',
      title: `Direct Match: ${directFlag.label}`,
      description: `Target wallet address is directly cataloged as a flagged entity in category: ${directFlag.category}.`,
      severity: directFlag.severity,
      hopDistance: 0,
      involvedAddress: normalizedAddress,
      category: directFlag.category,
      penaltyPoints: directFlag.riskScore,
    });
    calculatedScore += directFlag.riskScore;
  }

  // 3. Inspect transactions up to configured hop depth
  const graphNodes: Array<{ id: string; label: string; flagged: boolean; category?: string; depth: number }> = [
    {
      id: normalizedAddress,
      label: normalizedAddress,
      flagged: !!directFlag,
      category: directFlag?.category,
      depth: 0,
    },
  ];

  const graphEdges: Array<{ from: string; to: string; amount: number; token: string; direction: string }> = [];

  for (const tx of rpcData.transactions) {
    const counterparty = tx.counterparty.toLowerCase().trim();
    const hop = tx.hop || 1;

    // Check if counterparty is in flagged dataset
    const flaggedCounterparty = findFlaggedEntity(counterparty) || (tx.flagged ? {
      address: counterparty,
      category: 'mixer_simulation' as const,
      severity: 'HIGH' as const,
      label: 'Simulated Flagged Counterparty',
      riskScore: 90,
      flaggedSince: '2024-01-01T00:00:00Z',
      notes: 'Synthetic entity from scenario dataset',
    } : undefined);

    graphNodes.push({
      id: counterparty,
      label: flaggedCounterparty ? `${flaggedCounterparty.label} (${counterparty})` : counterparty,
      flagged: !!flaggedCounterparty,
      category: flaggedCounterparty?.category,
      depth: hop,
    });

    // Multi-hop history from NearBlocks says which account the money passed through ("via").
    const via = (tx as unknown as { via?: string }).via;
    graphEdges.push({
      from: tx.direction === 'OUT' ? normalizedAddress : counterparty,
      to: tx.direction === 'OUT' ? counterparty : (via || normalizedAddress),
      amount: tx.amountNear,
      token: tx.token,
      direction: tx.direction,
    });

    // Token whose launch matches Elliptic's description of the Nov 2026 NEAR memecoin laundering.
    const wt = watchToken((tx as unknown as { tokenContract?: string }).tokenContract);
    if (wt && !findings.some((f) => f.code === 'WATCHLISTED_TOKEN' && f.involvedAddress === wt.contract)) {
      findings.push({
        code: 'WATCHLISTED_TOKEN',
        title: `Watch-listed token: ${wt.symbol}`,
        description: `Received ${wt.symbol} (${wt.contract}) at hop ${hop}, a token whose launch matches Elliptic's report on the Nov 2026 NEAR memecoin laundering. This is a pattern match, not proof.`,
        severity: 'MEDIUM',
        hopDistance: hop,
        involvedAddress: wt.contract,
        penaltyPoints: 0,
      });
    }

    if (flaggedCounterparty) {
      let penalty = 0;
      if (hop === 1) {
        penalty = Math.round(flaggedCounterparty.riskScore * 0.95);
      } else if (hop === 2) {
        penalty = Math.round(flaggedCounterparty.riskScore * 0.45);
      } else {
        penalty = Math.round(flaggedCounterparty.riskScore * 0.20);
      }

      findings.push({
        code: `FLAGGED_COUNTERPARTY_HOP_${hop}`,
        title: `Flagged Exposure (${hop}-Hop): ${flaggedCounterparty.label}`,
        description: `Wallet interacted with flagged counterparty ${counterparty} via ${tx.token} transaction (${tx.amountNear} ${tx.token}) at hop distance ${hop}.`,
        severity: flaggedCounterparty.severity,
        hopDistance: hop,
        involvedAddress: counterparty,
        category: flaggedCounterparty.category,
        penaltyPoints: penalty,
      });

      calculatedScore += penalty;
    }
  }

  // 4. Deterministic Outcome Evaluation
  // Rule 0: The wallet itself is on a risk list -> rejected, whatever its history looks like
  if (directFlag) {
    outcome = 'REJECTED';
    calculatedScore = Math.min(100, Math.max(calculatedScore, 75));
  }
  // Rule A: Insufficient data or account not found
  else if (rpcData.scope.dataCompleteness === 'INSUFFICIENT' || !rpcData.accountExists) {
    outcome = 'INCONCLUSIVE';
    calculatedScore = Math.max(calculatedScore, 48); // Moderate inconclusive baseline
    findings.push({
      code: 'INSUFFICIENT_TRANSACTION_DATA',
      title: 'Assessment Inconclusive: Data Incomplete',
      description: rpcData.note || 'Historical transaction data could not be verified within the required confidence interval.',
      severity: 'MEDIUM',
      hopDistance: 0,
      penaltyPoints: 0,
    });
  }
  // Rule B: High risk or flagged findings detected
  else if (calculatedScore >= 50 || findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
    outcome = 'REJECTED';
    calculatedScore = Math.min(100, Math.max(calculatedScore, 75));
  }
  // Rule B2: Watch-listed token seen -> needs a human look; never an automatic approval
  else if (findings.some((f) => f.code === 'WATCHLISTED_TOKEN')) {
    outcome = 'INCONCLUSIVE';
    calculatedScore = Math.max(calculatedScore, 48);
  }
  // Rule C: Clean assessment within defined scope
  else {
    outcome = 'APPROVED';
    calculatedScore = Math.min(24, Math.max(calculatedScore, 4)); // Clean baseline score
  }

  // 5. Generate deterministic explanation
  const summaryExplanation = generateDeterministicSummary(outcome, calculatedScore, findings, rpcData.scope, riskListVersion);

  return {
    scanId,
    walletAddress: normalizedAddress,
    network: 'near-testnet',
    outcome,
    riskScore: calculatedScore,
    assessmentTimestamp: new Date().toISOString(),
    scope: rpcData.scope,
    riskListVersion,
    findings,
    summaryExplanation,
    normalizedGraph: {
      nodes: graphNodes,
      edges: graphEdges,
    },
  };
}

function generateDeterministicSummary(
  outcome: RiskOutcome,
  score: number,
  findings: RiskFinding[],
  scope: AssessmentScope,
  riskListVersion: string
): string {
  if (outcome === 'APPROVED') {
    return `Assessment APPROVED (Risk Score: ${score}/100). No matching risk indicators or flagged counterparties were identified within the configured scope (depth: ${scope.maxHopDepth} hops, ${scope.evaluatedTxCount} transactions evaluated against risk list ${riskListVersion}). This confirms passing a limited-scope assessment and does not constitute a guarantee of absolute fund cleanliness.`;
  }

  if (outcome === 'REJECTED') {
    const topFinding = findings[0];
    return `Assessment REJECTED (Risk Score: ${score}/100). Identified significant risk indicators within ${scope.maxHopDepth} hops: ${topFinding ? topFinding.title : 'High-risk interaction identified'}. Evaluated against risk list ${riskListVersion}. The observed exposure exceeds protocol risk tolerance thresholds.`;
  }

  if (findings.some((f) => f.code === 'WATCHLISTED_TOKEN')) {
    return `Assessment INCONCLUSIVE (Risk Score: ${score}/100). No address on risk list ${riskListVersion} was found within ${scope.maxHopDepth} hops, but the wallet received a watch-listed token linked by public reporting to the Nov 2026 NEAR memecoin laundering. A human should review it. An inconclusive assessment is never treated as an approval.`;
  }
  return `Assessment INCONCLUSIVE (Risk Score: ${score}/100). Insufficient verifiable blockchain transaction data is available for this wallet to establish a conclusive provenance trail within the configured ${scope.maxHopDepth}-hop window. In accordance with protocol safety specifications, an inconclusive assessment is never treated as an approval.`;
}
