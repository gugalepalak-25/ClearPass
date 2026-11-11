import { config } from '../config.js';
import { AssessmentResult } from '../types/index.js';

export async function generateAiExplanation(assessment: AssessmentResult): Promise<string> {
  // If AI API key is not configured, return deterministic structured analysis
  if (!config.aiApiKey) {
    return generateDeterministicAiFallback(assessment);
  }

  try {
    // Standard OpenAI/compatible REST call to avoid SDK version conflicts
    const prompt = `You are the ClearPass Protocol Risk Intelligence Auditor. Provide a clear, professional, plain-language 3-paragraph summary of this fund risk assessment for a NEAR wallet.

Assessment Data:
- Wallet Address: ${assessment.walletAddress}
- Outcome: ${assessment.outcome} (APPROVED, REJECTED, or INCONCLUSIVE)
- Risk Score: ${assessment.riskScore} / 100
- Hop Depth: ${assessment.scope.maxHopDepth} hops
- Evaluated Transactions: ${assessment.scope.evaluatedTxCount}
- Data Completeness: ${assessment.scope.dataCompleteness}
- Risk List Version: ${assessment.riskListVersion}
- Findings: ${JSON.stringify(assessment.findings.map(f => ({ title: f.title, severity: f.severity, hop: f.hopDistance, penalty: f.penaltyPoints })))}

Requirements:
1. Explain why this specific risk score and outcome were determined.
2. Clearly explain that ClearPass does NOT claim absolute cleanliness, only that it passed a defined assessment scope.
3. Detail what an external auditor or DeFi protocol can verify using the cryptographic certificate.
Keep tone objective, precise, and professional.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = (await response.json()) as any;
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        return text;
      }
    }
  } catch (err) {
    console.warn('[AI Explainer] Remote LLM request failed or timed out. Falling back to deterministic explainer.');
  }

  return generateDeterministicAiFallback(assessment);
}

function generateDeterministicAiFallback(assessment: AssessmentResult): string {
  const { outcome, riskScore, findings, scope, walletAddress } = assessment;

  if (outcome === 'APPROVED') {
    return `### Risk Analysis & Scope Summary
Account **${walletAddress}** was evaluated across **${scope.maxHopDepth} transaction hops** evaluating ${scope.evaluatedTxCount} on-chain records against risk dataset version **${assessment.riskListVersion}**. No direct or indirect exposure to known sanctioned, mixer, or exploit addresses was detected, resulting in a low risk score of **${riskScore}/100**.

### Protocol Interpretation
This assessment certifies that within the defined parameters (native NEAR and supported NEP-141 transfers across ${scope.maxHopDepth} hops), no flagged indicators were found. As emphasized by ClearPass security standards, this certificate validates limited-scope compliance rather than an absolute historical guarantee.

### What an Auditor Can Verify
An external auditor or DeFi protocol can verify the cryptographic Ed25519 signature of the certificate issuer and the on-chain verification record on the NEAR blockchain without requiring access to the user's private transaction history.`;
  }

  if (outcome === 'REJECTED') {
    const mainFinding = findings[0] || { title: 'High risk exposure', description: 'Suspicious counterparty proximity' };
    return `### Risk Analysis & Finding Summary
Account **${walletAddress}** received an elevated risk score of **${riskScore}/100**, leading to an outcome of **REJECTED**. The scanner identified critical risk indicators: **${mainFinding.title}** at hop distance ${mainFinding.hopDistance || 1}.

### Factor Breakdown
The counterparty involved was identified as a non-compliant or flagged entity (${mainFinding.category || 'high_risk'}). Even with hop penalty decay, proximity to this entity exceeds the acceptable threshold (maximum score 24 for approval).

### Auditor Implication
Any external party inspecting this certificate or on-chain record will observe the REJECTED status and risk score, enabling them to enforce risk-management rules while preserving raw account details.`;
  }

  return `### Inconclusive Assessment Details
Account **${walletAddress}** yielded an outcome of **INCONCLUSIVE** with an indeterminate baseline score of **${riskScore}/100**. The NEAR RPC or indexer could not provide sufficient contiguous transaction records to establish a conclusive provenance trail.

### Safe Protocol Defaults
ClearPass strictly adheres to the principle that an inconclusive result must never be treated as an approval. When historical data is insufficient or absent, the protocol withholds clean certification rather than making unverified assumptions.

### Next Steps for Verification
To achieve a conclusive result, ensure the wallet has recorded on-chain transactions on NEAR Testnet or retry when indexer synchronization has completed.`;
}

