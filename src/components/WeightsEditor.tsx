import { useState } from 'react';
import { DEFAULT_WEIGHTS } from '../config/appConfig';
import { validateWeights } from '../core/validation';
import { useAppData } from '../state/AppContext';
import type { PriorityWeights } from '../types';
import { ErrorBanner } from './ui';

const FIELDS: { key: keyof PriorityWeights; label: string }[] = [
  { key: 'overduePerDay', label: 'Points per overdue day' },
  { key: 'overdueCap', label: 'Max overdue points' },
  { key: 'high', label: 'High priority points' },
  { key: 'medium', label: 'Medium priority points' },
  { key: 'low', label: 'Low priority points' },
  { key: 'dueToday', label: 'Due-today points' },
];

/** Editable priority formula. Bucket order is fixed; these weights order visits inside a bucket. */
export function WeightsEditor() {
  const { weights, saveWeights } = useAppData();
  const [draft, setDraft] = useState<Record<keyof PriorityWeights, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f.key, String(weights[f.key])])) as Record<keyof PriorityWeights, string>,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsed = (): PriorityWeights => Object.fromEntries(FIELDS.map((f) => [f.key, draft[f.key].trim() === '' ? NaN : Number(draft[f.key])])) as unknown as PriorityWeights;

  const save = async () => {
    const next = parsed();
    const errors = validateWeights(next);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0] ?? 'Invalid value.');
      setMessage(null);
      return;
    }
    try {
      await saveWeights(next);
      setError(null);
      setMessage('Weights saved. The plan has been re-sorted.');
    } catch {
      setError('Could not save weights to local storage.');
    }
  };

  const reset = () => {
    setDraft(Object.fromEntries(FIELDS.map((f) => [f.key, String(DEFAULT_WEIGHTS[f.key])])) as Record<keyof PriorityWeights, string>);
    setMessage('Defaults loaded. Press Save to apply.');
  };

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key}>
            <span className="label">{f.label}</span>
            <input className="field" inputMode="numeric" value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={save}>Save weights</button>
        <button className="btn-secondary" onClick={reset}>Restore defaults</button>
        {message && <span className="text-sm text-brand-800" role="status">{message}</span>}
      </div>
    </div>
  );
}
