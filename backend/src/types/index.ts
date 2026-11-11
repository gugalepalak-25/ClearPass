export type RiskOutcome = 'APPROVED' | 'REJECTED' | 'INCONCLUSIVE';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EntityCategory =
  | 'sanctions_simulation'
  | 'mixer_simulation'
  | 'theft_simulation'
  | 'phishing_simulation'
  | 'high_risk_exchange_simulation';

export interface FlaggedEntity {
  address: string;
  category: EntityCategory;
  severity: RiskSeverity;
  label: string;
  riskScore: number;
  flaggedSince: string;
  notes: string;
}

export interface FlaggedRiskData {
  version: string;
  updatedAt: string;
  metadata: {
    source: string;
    description: string;
    disclaimer: string;
    network: string;
  };
  riskWeights: {
    directMatch: number;
    oneHop: number;
    twoHop: number;
    threeHop: number;
  };
  categories: Record<string, { baseScore: number; severity: RiskSeverity; description: string }>;
  entities: FlaggedEntity[];
  demoScenarios: Record<string, DemoScenario>;
}

export interface DemoScenario {
  id: string;
  name: string;
  account: string;
  description: string;
  expectedOutcome: RiskOutcome;
  expectedScore: number;
  mockHistory?: NormalizedTransaction[];
  reason?: string;
}

export interface NormalizedTransaction {
  hash: string;
  counterparty: string;
  amountNear: number;
  direction: 'IN' | 'OUT';
  timestamp: string;
  token: string;
  flagged?: boolean;
  hop?: number;
}

export interface RiskFinding {
  code: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  hopDistance: number;
  involvedAddress?: string;
  category?: EntityCategory;
  penaltyPoints: number;
}

export interface AssessmentScope {
  nativeNear: boolean;
  nep141Tokens: boolean;
  maxHopDepth: number;
  evaluatedTxCount: number;
  timeWindowDays: number;
  dataSource: 'near_rpc' | 'demo_scenario' | 'index_cache';
  dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
}

export interface AssessmentResult {
  scanId: string;
  walletAddress: string;
  network: string;
  outcome: RiskOutcome;
  riskScore: number; // 0 - 100
  assessmentTimestamp: string;
  scope: AssessmentScope;
  riskListVersion: string;
  findings: RiskFinding[];
  summaryExplanation: string;
  aiExplanation?: string;
  normalizedGraph: {
    nodes: Array<{ id: string; label: string; flagged: boolean; category?: string; depth: number }>;
    edges: Array<{ from: string; to: string; amount: number; token: string; direction: string }>;
  };
}

export interface VerificationCertificate {
  certificateId: string;
  walletAddress: string;
  network: string;
  outcome: RiskOutcome;
  riskScore: number;
  assessmentTimestamp: string;
  expiryTimestamp: string;
  assessmentScope: AssessmentScope;
  hopDepth: number;
  riskListVersion: string;
  issuerIdentity: string;
  issuerPublicKey: string;
  certHash: string;
  digitalSignature: string;
  onChainTxHash?: string;
  onChainContractId?: string;
  revoked: boolean;
  revocationReason?: string;
  revokedAt?: string;
  attestationReference: {
    type: 'ed25519_signature' | 'confidential_enclave_simulated';
    status: 'ACTIVE_DIGITAL_SIGNATURE';
    note: string;
  };
}

export interface SelectiveDisclosurePermissions {
  discloseOutcome: boolean;
  discloseRiskScore: boolean;
  discloseScopeAndHopDepth: boolean;
  discloseFindingsSummary: boolean;
  discloseRawCounterparties: boolean; // default false for privacy
}

export interface SelectiveDisclosurePackage {
  shareId: string;
  certificateId: string;
  walletAddress: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
  permissions: SelectiveDisclosurePermissions;
  encryptedPayload: string; // AES-256-GCM encrypted
  authTag: string;
  iv: string;
  issuerPublicKey: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'SCAN_EXECUTED' | 'CERTIFICATE_ISSUED' | 'CERTIFICATE_REVOKED' | 'CERTIFICATE_VERIFIED' | 'AUDITOR_SHARE_CREATED' | 'ON_CHAIN_SYNC';
  walletAddress: string;
  outcome?: RiskOutcome;
  certificateId?: string;
  details: string;
  metadata?: Record<string, any>;
}

