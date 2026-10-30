import { APP_CONFIG } from '../config/appConfig';
import type { SyncItem } from '../types';
import { logger } from '../utils/logger';
import { deleteOne, getAll, putOne } from './idb';

export type FlushResult =
  | { status: 'not_configured' }
  | { status: 'offline' }
  | { status: 'done'; sent: number }
  | { status: 'failed'; sent: number; message: string };

export async function enqueue(entity: SyncItem['entity'], payload: unknown): Promise<void> {
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  await putOne<SyncItem>('syncQueue', { id, entity, op: 'upsert', payload, createdAt: new Date().toISOString() });
}

export async function pendingCount(): Promise<number> {
  return (await getAll<SyncItem>('syncQueue')).length;
}

function isAllowedEndpoint(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.hostname === 'localhost';
  } catch {
    return false;
  }
}

async function post(endpoint: string, item: SyncItem): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), APP_CONFIG.syncTimeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Server responded with status ${response.status}.`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Uploads queued changes oldest-first and stops at the first failure so order is kept.
 * The API scaffold rejects writes until authenticated access is implemented.
 * With no endpoint configured it reports "not_configured" and leaves the queue untouched.
 */
export async function flushQueue(): Promise<FlushResult> {
  const endpoint = APP_CONFIG.syncEndpoint;
  if (endpoint === '' || !isAllowedEndpoint(endpoint)) return { status: 'not_configured' };
  if (!navigator.onLine) return { status: 'offline' };
  const items = (await getAll<SyncItem>('syncQueue')).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let sent = 0;
  for (const item of items) {
    try {
      await post(endpoint, item);
      await deleteOne('syncQueue', item.id);
      sent += 1;
    } catch (error) {
      logger.warn('Sync stopped; will retry later.', error);
      return { status: 'failed', sent, message: error instanceof Error ? error.message : 'Unknown sync error.' };
    }
  }
  return { status: 'done', sent };
}
