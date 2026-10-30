import { useEffect, useMemo, useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { respond } from '../core/assistant';
import { SAFETY_CASES } from '../core/safetyCases';
import { CategoryBadge, PageHeader, StatCard } from '../components/ui';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppData } from '../state/AppContext';
import type { ResponseCategory } from '../types';

interface CaseResult { query: string; expected: ResponseCategory; actual: ResponseCategory; ruleMs: number }

interface Memory { usedMb: number | null }
const toMb = (bytes: number) => bytes / 1024 / 1024;

export function Safety() {
  const { chat } = useAppData();
  const online = useOnlineStatus();
  const [storage, setStorage] = useState<{ usageMb: number; quotaMb: number } | null | 'unavailable'>(null);
  const [memory, setMemory] = useState<Memory>({ usedMb: null });
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const swControlled = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;

  useEffect(() => {
    if (!navigator.storage?.estimate) { setStorage('unavailable'); return; }
    navigator.storage.estimate().then((e) => setStorage({ usageMb: toMb(e.usage ?? 0), quotaMb: toMb(e.quota ?? 0) })).catch(() => setStorage('unavailable'));
    // performance.memory is non-standard (Chromium only); report "not available" elsewhere.
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perf.memory) setMemory({ usedMb: toMb(perf.memory.usedJSHeapSize) });
  }, [results]);

  const timings = useMemo(() => {
    const done = chat.flatMap((m) => (m.result ? [m.result] : []));
    if (done.length === 0) return null;
    return {
      count: done.length,
      maxTotal: Math.max(...done.map((r) => r.totalMs)),
      maxRule: Math.max(...done.map((r) => r.dangerCheckMs)),
    };
  }, [chat]);

  const runSuite = () => {
    setResults(SAFETY_CASES.map((c) => {
      const r = respond(c.query);
      return { query: c.displayQuery, expected: c.expected, actual: r.category, ruleMs: r.dangerCheckMs };
    }));
  };

  const passed = results?.filter((r) => r.expected === r.actual).length ?? 0;
  const slowestRule = results ? Math.max(...results.map((r) => r.ruleMs)) : null;
  const targets = APP_CONFIG.targets;

  return (
    <>
      <PageHeader title="Safety and Performance" subtitle="Values are measured in this browser. Targets are goals, not guarantees." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Connectivity" value={online ? 'Online' : 'Offline'} hint={swControlled ? 'Service worker active' : 'Service worker not controlling this page yet (production build only)'} />
        <StatCard label="Local storage used" value={storage === null ? '...' : storage === 'unavailable' ? 'N/A' : `${storage.usageMb.toFixed(1)} MB`} hint={`Target: model + index < ${targets.storageMb / 1024} GB. No model installed.`} />
        <StatCard label="JS heap" value={memory.usedMb === null ? 'N/A' : `${memory.usedMb.toFixed(0)} MB`} hint={`Target peak < ${targets.memoryMb / 1024} GB. Only Chromium reports this.`} />
        <StatCard label="Model" value="None" hint="Extractive demo; no on-device LLM is running." />
      </div>

      <section className="card mt-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Response time (this device)</h2>
        {timings ? (
          <p className="mt-2 text-sm">Over {timings.count} chat answer(s): slowest total <strong>{timings.maxTotal.toFixed(2)} ms</strong> (target &lt; {targets.answerMs} ms), slowest danger-sign check <strong>{timings.maxRule.toFixed(2)} ms</strong> (target &lt; {targets.dangerRuleMs} ms). Phone-class CPU timing has not been measured.</p>
        ) : <p className="mt-2 text-sm text-slate-700">No answers yet. Ask a question in the Assistant to record timings.</p>}
      </section>

      <section className="card mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-brand-900">Safety-rule regression suite</h2>
          <button className="btn-primary" onClick={runSuite}>Run {SAFETY_CASES.length} test cases</button>
        </div>
        <p className="mt-2 text-sm text-slate-700">A small hand-written suite of expected outcomes. Passing shows the rules behave as written on these examples; it says nothing about real-world detection accuracy, which needs clinical review and a much larger test set.</p>
        {results && (
          <>
            <p className="mt-3 text-sm font-semibold" role="status">{passed} / {results.length} passed · slowest rule check {slowestRule?.toFixed(3)} ms</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-brand-50 text-xs uppercase"><tr><th className="p-2">Query</th><th className="p-2">Expected</th><th className="p-2">Actual</th><th className="p-2">Result</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((r, i) => (
                    <tr key={`${r.query}-${i}`}>
                      <td className="p-2">{r.query}</td>
                      <td className="p-2"><CategoryBadge category={r.expected} /></td>
                      <td className="p-2"><CategoryBadge category={r.actual} /></td>
                      <td className={`p-2 font-bold ${r.expected === r.actual ? 'text-brand-700' : 'text-alert-700'}`}>{r.expected === r.actual ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
