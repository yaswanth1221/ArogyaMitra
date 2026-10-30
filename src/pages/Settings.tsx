import { useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { ErrorBanner, PageHeader } from '../components/ui';
import { WeightsEditor } from '../components/WeightsEditor';
import { useAppData } from '../state/AppContext';
import type { FlushResult } from '../storage/syncQueue';

function describe(result: FlushResult): string {
  switch (result.status) {
    case 'not_configured': return 'No sync backend is configured, so nothing was uploaded. Changes stay queued on this device.';
    case 'offline': return 'You are offline. Changes stay queued.';
    case 'done': return `Uploaded ${result.sent} change(s).`;
    case 'failed': return `Sync stopped after ${result.sent} change(s): ${result.message}`;
  }
}

export function Settings() {
  const { pendingSync, syncNow, resetDemoData, clearChat, error } = useAppData();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const run = async (work: () => Promise<void>) => {
    try { await work(); setLocalError(null); } catch { setLocalError('That action failed. Check browser storage settings.'); }
  };

  return (
    <>
      <PageHeader title="Settings" />
      {(localError ?? error) && <ErrorBanner message={(localError ?? error) as string} />}

      <section className="card mb-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Priority weights</h2>
        <p className="mb-3 text-sm text-slate-700">Changes re-sort the Daily Visit Planner immediately.</p>
        <WeightsEditor />
      </section>

      <section className="card mb-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Sync queue</h2>
        <p className="mt-1 text-sm">{pendingSync} change(s) waiting. Sync endpoint: <strong>{APP_CONFIG.syncEndpoint === '' ? 'not configured' : 'configured (untested)'}</strong>.</p>
        <p className="mt-1 text-sm text-slate-700">Cloud database support is being prepared, but syncing is disabled until authenticated worker access is configured. Changes remain stored on this device; do not set <code>VITE_SYNC_ENDPOINT</code> yet.</p>
        <button className="btn-secondary mt-3" onClick={() => void syncNow().then((r) => setSyncMessage(describe(r)))}>Try sync now</button>
        {syncMessage && <p className="mt-2 text-sm" role="status">{syncMessage}</p>}
      </section>

      <section className="card mb-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Local data</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => void run(clearChat)}>Clear chat history</button>
          {!confirmReset ? (
            <button className="btn-danger" onClick={() => setConfirmReset(true)}>Reset demo data</button>
          ) : (
            <>
              <button className="btn-danger" onClick={() => void run(async () => { await resetDemoData(); setConfirmReset(false); })}>Confirm: erase households, notes and settings</button>
              <button className="btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-bold text-brand-900">About this prototype</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>Records are stored locally in this browser (IndexedDB). Cloud sync is currently disabled.</li>
          <li>Protocol text and danger-sign rules are unreviewed demonstration content.</li>
          <li>No language model is bundled; answers are extracted from the local protocol library.</li>
          <li>This is not a medical device and must not guide real clinical decisions.</li>
        </ul>
      </section>
    </>
  );
}
