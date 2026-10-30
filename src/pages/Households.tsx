import { useMemo, useState, type FormEvent } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { validateHousehold, type HouseholdDraft } from '../core/validation';
import { DEMO_VILLAGES, MEMBER_CATEGORIES, PRIORITIES, VISIT_TYPES } from '../data/categories';
import { DemoBadge, EmptyState, ErrorBanner, Modal, PageHeader, PriorityBadge } from '../components/ui';
import { useAppData } from '../state/AppContext';
import type { Household } from '../types';
import { logger } from '../utils/logger';
import { downloadHouseholdsExcel } from '../utils/excelReport';

function HouseholdForm({ initial, onDone }: { initial?: Household; onDone: () => void }) {
  const { saveHousehold, today } = useAppData();
  const [draft, setDraft] = useState<HouseholdDraft>(
    initial ?? { village: '', memberCategory: MEMBER_CATEGORIES[0], visitType: VISIT_TYPES[0], dueDate: today, priority: 'Medium', status: 'Pending' },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof HouseholdDraft, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof HouseholdDraft>(key: K, value: HouseholdDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateHousehold(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await saveHousehold({ ...draft, village: draft.village.trim(), id: initial?.id });
      onDone();
    } catch {
      setSaveError('Could not save to local storage.');
    }
  };

  const err = (k: keyof HouseholdDraft) => errors[k] && <span className="mt-1 block text-xs text-alert-700" role="alert">{errors[k]}</span>;

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {saveError && <ErrorBanner message={saveError} />}
      <label className="block"><span className="label">Village</span>
        <input className="field" list="villages" value={draft.village} maxLength={APP_CONFIG.limits.villageChars} onChange={(e) => set('village', e.target.value)} />
        <datalist id="villages">{DEMO_VILLAGES.map((v) => <option key={v} value={v} />)}</datalist>{err('village')}
      </label>
      <label className="block"><span className="label">Household member category</span>
        <select className="field" value={draft.memberCategory} onChange={(e) => set('memberCategory', e.target.value)}>
          {MEMBER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>{err('memberCategory')}
      </label>
      <label className="block"><span className="label">Visit type</span>
        <select className="field" value={draft.visitType} onChange={(e) => set('visitType', e.target.value)}>
          {VISIT_TYPES.map((c) => <option key={c}>{c}</option>)}
        </select>{err('visitType')}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Due date</span>
          <input className="field" type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} />{err('dueDate')}
        </label>
        <label className="block"><span className="label">Priority</span>
          <select className="field" value={draft.priority} onChange={(e) => set('priority', e.target.value as Household['priority'])}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <label className="block"><span className="label">Visit status</span>
        <select className="field" value={draft.status} onChange={(e) => set('status', e.target.value as Household['status'])}>
          <option>Pending</option><option>Completed</option>
        </select>
      </label>
      <p className="text-xs text-slate-600">Enter synthetic or test data only. Do not type real patient details.</p>
      <button className="btn-primary w-full" type="submit">{initial ? 'Save changes' : 'Add household'}</button>
    </form>
  );
}

export function Households() {
  const { households, today } = useAppData();
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Household | 'new' | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return households.filter(
      (h) =>
        (priority === 'All' || h.priority === priority) &&
        (status === 'All' || h.status === status) &&
        (category === 'All' || h.memberCategory === category) &&
        (q === '' || [h.id, h.village, h.memberCategory, h.visitType].some((f) => f.toLowerCase().includes(q))),
    );
  }, [households, query, priority, status, category]);

  const pages = Math.max(1, Math.ceil(filtered.length / APP_CONFIG.pageSize));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * APP_CONFIG.pageSize, (current + 1) * APP_CONFIG.pageSize);
  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0); };
  const exportHouseholds = () => {
    try {
      downloadHouseholdsExcel(filtered, today);
      setExportMessage(`Downloaded Excel sheet with ${filtered.length} household record(s).`);
    } catch (error) {
      logger.error('Household Excel export failed.', error);
      setExportMessage('Could not create the households Excel file. Please try again.');
    }
  };

  return (
    <>
      <PageHeader title="Household Register" subtitle={`${filtered.length} of ${households.length} records`}
        action={<div className="flex flex-wrap items-center gap-2"><DemoBadge>Synthetic records</DemoBadge><button className="btn-secondary" onClick={exportHouseholds}>Download Excel</button><button className="btn-primary" onClick={() => setEditing('new')}>Add household</button></div>} />
      {exportMessage && <p className="mb-3 text-sm font-semibold text-brand-800" role="status" aria-live="polite">{exportMessage}</p>}
      <div className="card mb-4 grid gap-3 sm:grid-cols-4">
        <label className="sm:col-span-2"><span className="label">Search</span>
          <input className="field" placeholder="ID, village, category, visit type" value={query} onChange={(e) => reset(setQuery)(e.target.value)} />
        </label>
        <label><span className="label">Priority</span>
          <select className="field" value={priority} onChange={(e) => reset(setPriority)(e.target.value)}><option>All</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label><span className="label">Status</span>
          <select className="field" value={status} onChange={(e) => reset(setStatus)(e.target.value)}><option>All</option><option>Pending</option><option>Completed</option></select>
        </label>
        <label className="sm:col-span-4"><span className="label">Member category</span>
          <select className="field" value={category} onChange={(e) => reset(setCategory)(e.target.value)}><option>All</option>{MEMBER_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No households match" hint="Clear the search or filters." />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-brand-50 text-xs uppercase text-brand-900">
              <tr>{['ID', 'Village', 'Member category', 'Visit type', 'Due', 'Priority', 'Status', ''].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((h) => (
                <tr key={h.id}>
                  <td className="px-3 py-2 font-semibold">{h.id}{!h.isDemo && <span className="ml-1 text-xs text-brand-700">(you)</span>}</td>
                  <td className="px-3 py-2">{h.village}</td>
                  <td className="px-3 py-2">{h.memberCategory}</td>
                  <td className="px-3 py-2">{h.visitType}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{h.dueDate}</td>
                  <td className="px-3 py-2"><PriorityBadge priority={h.priority} /></td>
                  <td className="px-3 py-2">{h.status}</td>
                  <td className="px-3 py-2"><button className="font-semibold text-brand-700 underline" onClick={() => setEditing(h)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <button className="btn-secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
        <span>Page {current + 1} of {pages}</span>
        <button className="btn-secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add household' : `Edit ${editing.id}`} onClose={() => setEditing(null)}>
          <HouseholdForm initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
