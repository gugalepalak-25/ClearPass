import { NormalizedTransaction, AssessmentScope } from '../types/index.js';
import { getScenarioById, loadRiskData } from './flagged-data.js';
import { fetchNearBlocksHistory, scanNetwork, scanRpcUrl } from './real-data.js';

export interface WalletRpcData {
  accountExists: boolean;
  balanceNear?: string;
  storageUsage?: number;
  transactions: NormalizedTransaction[];
  scope: AssessmentScope;
  liveRpcQueried: boolean;
  rpcLatencyMs: number;
  note?: string;
}

export async function fetchWalletHistory(
  accountAddress: string,
  hopDepth: number = 2,
  scenarioOverride?: string
): Promise<WalletRpcData> {
  const startTime = Date.now();
  const normalizedAccount = accountAddress.toLowerCase().trim();

  // 1. Check if a demo scenario is explicitly requested or matches synthetic scenario accounts
  const riskData = loadRiskData();
  let matchedScenario = scenarioOverride ? getScenarioById(scenarioOverride) : undefined;

  if (!matchedScenario) {
    for (const s of Object.values(riskData.demoScenarios)) {
      if (s.account.toLowerCase() === normalizedAccount) {
        matchedScenario = s;
        break;
      }
    }
  }

  if (matchedScenario) {
    const latency = Date.now() - startTime;
    if (matchedScenario.id === 'scenario_inconclusive') {
      return {
        accountExists: true,
        balanceNear: '0.00',
        storageUsage: 0,
        transactions: [],
        scope: {
          nativeNear: true,
          nep141Tokens: true,
          maxHopDepth: hopDepth,
          evaluatedTxCount: 0,
          timeWindowDays: 90,
          dataSource: 'demo_scenario',
          dataCompleteness: 'INSUFFICIENT',
        },
        liveRpcQueried: false,
        rpcLatencyMs: latency,
        note: matchedScenario.reason || 'Insufficient data: Account has no indexed transaction history within allowable scope.',
      };
    }

    const txs = (matchedScenario.mockHistory || []).map((tx) => ({
      ...tx,
      hop: tx.hop || 1,
    }));

    return {
      accountExists: true,
      balanceNear: '142.50',
      storageUsage: 18200,
      transactions: txs,
      scope: {
        nativeNear: true,
        nep141Tokens: true,
        maxHopDepth: hopDepth,
        evaluatedTxCount: txs.length,
        timeWindowDays: 90,
        dataSource: 'demo_scenario',
        dataCompleteness: 'COMPLETE',
      },
      liveRpcQueried: false,
      rpcLatencyMs: latency,
      note: `Evaluated via ${matchedScenario.name} (Synthetic Demonstration Profile).`,
    };
  }

  // 2. Query the live NEAR network the wallet lives on (SCAN_NETWORK, default mainnet)
  try {
    const rpcResponse = await fetch(scanRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'clearpass-view-account',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: normalizedAccount,
        },
      }),
    });

    const latency = Date.now() - startTime;

    if (!rpcResponse.ok) {
      return {
        accountExists: false,
        transactions: [],
        scope: {
          nativeNear: true,
          nep141Tokens: false,
          maxHopDepth: hopDepth,
          evaluatedTxCount: 0,
          timeWindowDays: 90,
          dataSource: 'near_rpc',
          dataCompleteness: 'INSUFFICIENT',
        },
        liveRpcQueried: true,
        rpcLatencyMs: latency,
        note: `NEAR RPC query returned HTTP status ${rpcResponse.status}. Account could not be verified on ${scanNetwork}.`,
      };
    }

    const data = (await rpcResponse.json()) as any;

    if (data.error) {
      // Account does not exist on testnet
      return {
        accountExists: false,
        transactions: [],
        scope: {
          nativeNear: true,
          nep141Tokens: false,
          maxHopDepth: hopDepth,
          evaluatedTxCount: 0,
          timeWindowDays: 90,
          dataSource: 'near_rpc',
          dataCompleteness: 'INSUFFICIENT',
        },
        liveRpcQueried: true,
        rpcLatencyMs: latency,
        note: `Account '${normalizedAccount}' does not exist on NEAR ${scanNetwork} or has been deleted.`,
      };
    }

    // Account exists on testnet!
    const rawBalance = data.result?.amount || '0';
    // Format yoctoNEAR to human NEAR (1 NEAR = 1e24 yocto)
    const nearBalance = (Number(BigInt(rawBalance) / 10n ** 20n) / 10000).toFixed(4);
    const storageUsage = data.result?.storage_usage || 0;

    // Real transfer history from NearBlocks (NEAR RPC can't list past transactions).
    // An existing account with NO readable history is INSUFFICIENT, never an automatic approval.
    const history = await fetchNearBlocksHistory(normalizedAccount, hopDepth);

    return {
      accountExists: true,
      balanceNear: nearBalance,
      storageUsage,
      transactions: history.transactions,
      scope: {
        nativeNear: true,
        nep141Tokens: true,
        maxHopDepth: hopDepth,
        evaluatedTxCount: history.transactions.length,
        timeWindowDays: 90,
        dataSource: 'near_rpc',
        dataCompleteness: history.completeness,
      },
      liveRpcQueried: true,
      rpcLatencyMs: Date.now() - startTime,
      note: `Verified live on NEAR ${scanNetwork}. Balance: ${nearBalance} NEAR. ${history.note}`,
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      accountExists: false,
      transactions: [],
      scope: {
        nativeNear: true,
        nep141Tokens: false,
        maxHopDepth: hopDepth,
        evaluatedTxCount: 0,
        timeWindowDays: 90,
        dataSource: 'near_rpc',
        dataCompleteness: 'INSUFFICIENT',
      },
      liveRpcQueried: true,
      rpcLatencyMs: latency,
      note: `Network error querying NEAR RPC: ${err?.message || 'Connection timeout'}`,
    };
  }
}

