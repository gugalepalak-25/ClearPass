import crypto from 'node:crypto';
import { ActivityLogEntry } from '../types/index.js';

const activityLogs: ActivityLogEntry[] = [
  {
    id: 'act_init_1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'ON_CHAIN_SYNC',
    walletAddress: 'system.testnet',
    details: 'ClearPass Verification Registry synchronized with NEAR Testnet contract.',
  },
];

export function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): ActivityLogEntry {
  const newEntry: ActivityLogEntry = {
    id: `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  activityLogs.unshift(newEntry);
  if (activityLogs.length > 200) {
    activityLogs.pop();
  }
  return newEntry;
}

export function getActivityLogs(limit = 50): ActivityLogEntry[] {
  return activityLogs.slice(0, limit);
}

