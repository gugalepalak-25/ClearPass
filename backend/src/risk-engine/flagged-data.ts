import fs from 'node:fs';
import { config } from '../config.js';
import { FlaggedRiskData, FlaggedEntity, DemoScenario } from '../types/index.js';

let cachedRiskData: FlaggedRiskData | null = null;

export function loadRiskData(): FlaggedRiskData {
  if (cachedRiskData) {
    return cachedRiskData;
  }

  try {
    if (fs.existsSync(config.riskListPath)) {
      const raw = fs.readFileSync(config.riskListPath, 'utf8');
      cachedRiskData = JSON.parse(raw) as FlaggedRiskData;
      return cachedRiskData;
    }
  } catch (err) {
    console.warn(`[RiskData] Warning: Unable to read risk list from ${config.riskListPath}, using fallback in-memory dataset.`);
  }

  // Resilient fallback in-memory dataset if file read fails
  cachedRiskData = {
    version: '2026.11-fallback-v1',
    updatedAt: new Date().toISOString(),
    metadata: {
      source: 'ClearPass Synthetic Intelligence Engine (Fallback)',
      description: 'Synthetic test dataset',
      disclaimer: 'DEMO RISK DATASET: Strictly for testing and demonstration.',
      network: 'near-testnet',
    },
    riskWeights: {
      directMatch: 85,
      oneHop: 45,
      twoHop: 25,
      threeHop: 10,
    },
    categories: {
      sanctions_simulation: { baseScore: 95, severity: 'CRITICAL', description: 'Simulated sanctions watchlist' },
      mixer_simulation: { baseScore: 90, severity: 'HIGH', description: 'Simulated fund pooling mixer' },
      theft_simulation: { baseScore: 90, severity: 'HIGH', description: 'Simulated exploit drainer' },
      phishing_simulation: { baseScore: 85, severity: 'HIGH', description: 'Simulated phishing drainer' },
      high_risk_exchange_simulation: { baseScore: 60, severity: 'MEDIUM', description: 'Simulated high-risk unhosted counterparty' },
    },
    entities: [
      {
        address: 'flagged-mixer-demo.testnet',
        category: 'mixer_simulation',
        severity: 'HIGH',
        label: 'Tornado-style Mixer Pool Demo',
        riskScore: 90,
        flaggedSince: '2024-01-15T00:00:00Z',
        notes: 'Synthetic address representing mixer contract',
      },
      {
        address: 'flagged-theft-demo.testnet',
        category: 'theft_simulation',
        severity: 'CRITICAL',
        label: 'Simulated Bridge Exploit Drainer',
        riskScore: 95,
        flaggedSince: '2024-03-20T00:00:00Z',
        notes: 'Synthetic address representing drain wallet',
      },
      {
        address: 'flagged-sanction-demo.testnet',
        category: 'sanctions_simulation',
        severity: 'CRITICAL',
        label: 'Simulated Designated National Entity',
        riskScore: 100,
        flaggedSince: '2023-11-01T00:00:00Z',
        notes: 'Synthetic address representing sanctioned entity',
      },
      {
        address: 'flagged-phishing-demo.testnet',
        category: 'phishing_simulation',
        severity: 'HIGH',
        label: 'Fake DEX Approval Drainer',
        riskScore: 85,
        flaggedSince: '2024-06-10T00:00:00Z',
        notes: 'Synthetic address representing phishing contract',
      },
    ],
    demoScenarios: {
      scenario_low_risk: {
        id: 'scenario_low_risk',
        name: 'Scenario 1: Low-Risk Wallet',
        account: 'alice-clean-demo.testnet',
        description: 'Synthetic or real test wallet with no matching indicators.',
        expectedOutcome: 'APPROVED',
        expectedScore: 5,
      },
      scenario_flagged: {
        id: 'scenario_flagged',
        name: 'Scenario 2: Flagged Wallet',
        account: 'charlie-compromised-demo.testnet',
        description: 'Synthetic demo wallet directly interacting with flagged-mixer-demo.testnet.',
        expectedOutcome: 'REJECTED',
        expectedScore: 88,
      },
      scenario_inconclusive: {
        id: 'scenario_inconclusive',
        name: 'Scenario 3: Insufficient Information',
        account: 'unknown-dormant-demo.testnet',
        description: 'Wallet with unresolvable state or empty indexer records.',
        expectedOutcome: 'INCONCLUSIVE',
        expectedScore: 48,
      },
    },
  };

  return cachedRiskData;
}

export function findFlaggedEntity(address: string): FlaggedEntity | undefined {
  const data = loadRiskData();
  const normalized = address.toLowerCase().trim();
  return data.entities.find((e) => e.address.toLowerCase().trim() === normalized);
}

export function getDemoScenarios(): Record<string, DemoScenario> {
  const data = loadRiskData();
  return data.demoScenarios;
}

export function getScenarioById(id: string): DemoScenario | undefined {
  const scenarios = getDemoScenarios();
  return scenarios[id];
}

