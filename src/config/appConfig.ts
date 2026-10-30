import type { PriorityWeights } from '../types';

/** Single place for tunable settings (thresholds, limits, targets, feature flags). */
export const APP_CONFIG = {
  dbName: 'pulseguard-r2',
  dbVersion: 1,
  demoHouseholdCount: 500,
  demoSeed: 20261030,
  /** Minimum retrieval score before an answer is allowed; below it the app refuses. */
  retrievalMinScore: 2,
  pageSize: 25,
  limits: { chatChars: 500, noteChars: 1000, villageChars: 60, maxWeight: 1000 },
  /** Targets from the project brief. They are goals, not measured results. */
  targets: { storageMb: 1024, memoryMb: 1536, answerMs: 5000, dangerRuleMs: 50 },
  /** Empty means no backend is configured, so sync is reported as not configured. */
  syncEndpoint: (import.meta.env.VITE_SYNC_ENDPOINT as string | undefined) ?? '',
  syncTimeoutMs: 8000,
} as const;

export const DEFAULT_WEIGHTS: PriorityWeights = {
  overduePerDay: 2,
  overdueCap: 30,
  high: 50,
  medium: 20,
  low: 0,
  dueToday: 10,
};
