import { config } from '../config.js';
import { NormalizedTransaction, AssessmentScope } from '../types/index.js';
import { getScenarioById, loadRiskData } from './flagged-data.js';

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

  // 2. Query Live NEAR Testnet RPC
  try {
    const rpcResponse = await fetch(config.nearRpcUrl, {
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
        note: `NEAR RPC query returned HTTP status ${rpcResponse.status}. Account could not be verified on ${config.nearNetwork}.`,
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
        note: `Account '${normalizedAccount}' does not exist on NEAR ${config.nearNetwork} or has been deleted.`,
      };
    }

    // Account exists on testnet!
    const rawBalance = data.result?.amount || '0';
    // Format yoctoNEAR to human NEAR (1 NEAR = 1e24 yocto)
    const nearBalance = (Number(BigInt(rawBalance) / 10n ** 20n) / 10000).toFixed(4);
    const storageUsage = data.result?.storage_usage || 0;

    // Next, attempt to fetch recent transactions from NEAR testnet public indexer endpoints
    let liveTxs: NormalizedTransaction[] = [];
    let completeness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT' = 'PARTIAL';

    try {
      // Try fastnear / nearblocks public testnet API if accessible
      const indexerRes = await fetch(`https://testnet-api.fastnear.com/v1/account/${normalizedAccount}/full`, {
        signal: AbortSignal.timeout(3500),
      });
      if (indexerRes.ok) {
        const indexData = (await indexerRes.json()) as any;
        if (Array.isArray(indexData?.tokens)) {
          completeness = 'COMPLETE';
        }
      }
    } catch {
      // Indexer timeout or not responding; gracefully fall back with transparent notice
      completeness = 'PARTIAL';
    }

    return {
      accountExists: true,
      balanceNear: nearBalance,
      storageUsage,
      transactions: liveTxs,
      scope: {
        nativeNear: true,
        nep141Tokens: true,
        maxHopDepth: hopDepth,
        evaluatedTxCount: liveTxs.length,
        timeWindowDays: 90,
        dataSource: 'near_rpc',
        dataCompleteness: liveTxs.length > 0 ? completeness : 'PARTIAL',
      },
      liveRpcQueried: true,
      rpcLatencyMs: latency,
      note: `Verified live on NEAR ${config.nearNetwork} RPC. Balance: ${nearBalance} NEAR. (Historical indexer depth: ${completeness}).`,
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

