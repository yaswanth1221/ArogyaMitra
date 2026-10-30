import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { generateDemoHouseholds, formatHouseholdId, updateLegacyDemoVillages } from '../data/demoHouseholds';
import { repository } from '../storage/repository';
import { enqueue, flushQueue, pendingCount, type FlushResult } from '../storage/syncQueue';
import type { ChatMessage, Household, PriorityWeights, VisitNote } from '../types';
import { todayIso } from '../utils/dates';
import { logger } from '../utils/logger';

type Status = 'loading' | 'ready' | 'error';

interface AppData {
  status: Status;
  error: string | null;
  today: string;
  households: Household[];
  notes: VisitNote[];
  chat: ChatMessage[];
  weights: PriorityWeights;
  pendingSync: number;
  saveHousehold: (draft: Omit<Household, 'id' | 'isDemo'> & { id?: string }) => Promise<void>;
  completeVisit: (id: string, noteText: string) => Promise<void>;
  appendChat: (messages: ChatMessage[]) => Promise<void>;
  clearChat: () => Promise<void>;
  saveWeights: (w: PriorityWeights) => Promise<void>;
  resetDemoData: () => Promise<void>;
  syncNow: () => Promise<FlushResult>;
}

const AppContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [notes, setNotes] = useState<VisitNote[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [weights, setWeights] = useState<PriorityWeights | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const today = useMemo(() => todayIso(), []);

  const load = useCallback(async () => {
    if (!(await repository.isSeeded())) {
      await repository.saveHouseholds(generateDemoHouseholds(today));
      await repository.markSeeded();
    }
    const [storedHouseholds, n, c, w, p] = await Promise.all([
      repository.loadHouseholds(), repository.loadNotes(), repository.loadChat(), repository.loadWeights(), pendingCount(),
    ]);
    const h = updateLegacyDemoVillages(storedHouseholds, today);
    if (h.some((household, index) => household !== storedHouseholds[index])) {
      await repository.saveHouseholds(h);
    }
    setHouseholds(h.sort((a, b) => a.id.localeCompare(b.id)));
    setNotes(n);
    setChat(c);
    setWeights(w);
    setPendingSync(p);
  }, [today]);

  useEffect(() => {
    load()
      .then(() => setStatus('ready'))
      .catch((e: unknown) => {
        logger.error('Failed to load local data', e);
        setError(e instanceof Error ? e.message : 'Local storage failed to load.');
        setStatus('error');
      });
  }, [load]);

  /** Wraps a persistence call so a storage failure becomes a visible error, not a silent one. */
  const guard = useCallback(async (work: () => Promise<void>) => {
    try {
      await work();
      setPendingSync(await pendingCount());
    } catch (e) {
      logger.error('Local save failed', e);
      setError(e instanceof Error ? e.message : 'Saving to local storage failed.');
      throw e;
    }
  }, []);

  const saveHousehold = useCallback<AppData['saveHousehold']>(
    (draft) =>
      guard(async () => {
        const existing = draft.id ? households.find((h) => h.id === draft.id) : undefined;
        const nextNumber = households.reduce((max, h) => Math.max(max, Number(h.id.slice(3)) || 0), 0) + 1;
        const record: Household = {
          ...draft,
          id: existing?.id ?? formatHouseholdId(nextNumber),
          isDemo: existing?.isDemo ?? false,
          completedAt: draft.status === 'Completed' ? (draft.completedAt ?? today) : undefined,
        };
        await repository.saveHousehold(record);
        await enqueue('household', record);
        setHouseholds((prev) => (existing ? prev.map((h) => (h.id === record.id ? record : h)) : [...prev, record]));
      }),
    [guard, households, today],
  );

  const completeVisit = useCallback<AppData['completeVisit']>(
    (id, noteText) =>
      guard(async () => {
        const target = households.find((h) => h.id === id);
        if (!target) throw new Error('Household not found.');
        const done: Household = { ...target, status: 'Completed', completedAt: today };
        await repository.saveHousehold(done);
        await enqueue('household', done);
        setHouseholds((prev) => prev.map((h) => (h.id === id ? done : h)));
        const text = noteText.trim();
        if (text !== '') {
          const note: VisitNote = { id: crypto.randomUUID(), householdId: id, text, createdAt: new Date().toISOString() };
          await repository.saveNote(note);
          await enqueue('note', note);
          setNotes((prev) => [...prev, note]);
        }
      }),
    [guard, households, today],
  );

  const appendChat = useCallback<AppData['appendChat']>(
    (messages) =>
      guard(async () => {
        await repository.saveChat(messages);
        setChat((prev) => [...prev, ...messages]);
      }),
    [guard],
  );

  const clearChat = useCallback(() => guard(async () => { await repository.clearChat(); setChat([]); }), [guard]);

  const saveWeights = useCallback<AppData['saveWeights']>(
    (w) => guard(async () => { await repository.saveWeights(w); setWeights(w); }),
    [guard],
  );

  const resetDemoData = useCallback(
    () => guard(async () => { await repository.resetRecords(); await load(); }),
    [guard, load],
  );

  const syncNow = useCallback(async () => {
    const result = await flushQueue();
    setPendingSync(await pendingCount());
    return result;
  }, []);

  if (!weights) {
    return <AppContext.Provider value={null}>{status === 'error' ? <LoadError message={error} /> : <LoadingScreen />}</AppContext.Provider>;
  }

  const value: AppData = {
    status, error, today, households, notes, chat, weights, pendingSync,
    saveHousehold, completeVisit, appendChat, clearChat, saveWeights, resetDemoData, syncNow,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-brand-800" role="status">
      Loading local data...
    </div>
  );
}

function LoadError({ message }: { message: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="max-w-md rounded-lg border-2 border-alert-600 bg-white p-5" role="alert">
        <h1 className="text-lg font-bold text-alert-700">Local storage unavailable</h1>
        <p className="mt-2 text-sm">{message ?? 'The app could not open its offline database.'} Try a current browser and disable private browsing.</p>
      </div>
    </div>
  );
}
