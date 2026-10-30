import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { BUCKET_LABELS, planVisits, type Bucket, type PlannedVisit } from '../core/priority';
import { validateText } from '../core/validation';
import { EmptyState, ErrorBanner, Modal, PageHeader, PriorityBadge } from '../components/ui';
import { overdueText } from '../components/PlanFormatting';
import { WeightsEditor } from '../components/WeightsEditor';
import { useAppData } from '../state/AppContext';
import { logger } from '../utils/logger';
import { downloadPlannerExcel } from '../utils/excelReport';

const BUCKETS: Bucket[] = [1, 2, 3, 4];
const UPCOMING_LIMIT = 15;

function VisitRow({ visit, onComplete }: { visit: PlannedVisit; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const h = visit.household;
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong>{h.id}</strong> · {h.village} · {h.memberCategory}
          <span className="block text-slate-700">{h.visitType} · due {h.dueDate} {overdueText(visit.overdueDays) && `· ${overdueText(visit.overdueDays)}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={h.priority} />
          <button className="text-xs font-semibold underline" aria-expanded={open} onClick={() => setOpen(!open)}>Score {visit.score}</button>
          <button className="btn-primary !min-h-[40px]" onClick={onComplete}>Mark completed</button>
        </div>
      </div>
      {open && (
        <ul className="mt-2 rounded bg-slate-100 p-2 text-xs">
          {visit.parts.map((p) => <li key={p.label}>{p.label}: <strong>+{p.points}</strong></li>)}
          <li className="mt-1 border-t border-slate-300 pt-1">Total score {visit.score} (orders visits inside this group)</li>
        </ul>
      )}
    </li>
  );
}

export function Planner() {
  const { households, weights, notes, completeVisit, today } = useAppData();
  const [target, setTarget] = useState<PlannedVisit | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const plan = useMemo(() => planVisits(households, today, weights), [households, weights, today]);
  const recentNotes = useMemo(() => [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8), [notes]);
  const exportPlan = () => {
    try {
      downloadPlannerExcel(plan, today);
      setExportMessage(`Downloaded Excel visit plan with ${plan.length} pending visit(s).`);
    } catch (exportError) {
      logger.error('Visit planner Excel export failed.', exportError);
      setExportMessage('Could not create the visit planner Excel file. Please try again.');
    }
  };

  const confirm = async () => {
    if (!target) return;
    const trimmed = note.trim();
    if (trimmed !== '') {
      const problem = validateText(trimmed, APP_CONFIG.limits.noteChars, 'Visit note');
      if (problem) { setError(problem); return; }
    }
    try {
      await completeVisit(target.household.id, trimmed);
      setTarget(null); setNote(''); setError(null);
    } catch {
      setError('Could not save the visit locally.');
    }
  };

  return (
    <>
      <PageHeader
        title="Daily Visit Planner"
        subtitle={`Plan for ${today}. Completed visits and notes are saved on this device.`}
        action={<button className="btn-secondary" onClick={exportPlan}>Download Excel</button>}
      />
      {exportMessage && <p className="mb-3 text-sm font-semibold text-brand-800" role="status" aria-live="polite">{exportMessage}</p>}
      <details className="card mb-5">
        <summary className="cursor-pointer font-semibold text-brand-900">How priority is calculated (editable)</summary>
        <p className="my-3 text-sm text-slate-700">
          Visits fall into four fixed groups: 1) overdue high-risk, 2) high-priority due today, 3) other due today or overdue, 4) upcoming.
          Inside a group they are sorted by the score below, then by due date. Score = overdue points + priority points + due-today points.
        </p>
        <WeightsEditor />
      </details>

      {BUCKETS.map((b) => {
        const items = plan.filter((p) => p.bucket === b);
        const shown = b === 4 && !showAllUpcoming ? items.slice(0, UPCOMING_LIMIT) : items;
        return (
          <section key={b} className="card mb-4" aria-labelledby={`bucket-${b}`}>
            <h2 id={`bucket-${b}`} className="font-display text-lg font-bold text-brand-900">{b}. {BUCKET_LABELS[b]} <span className="text-sm font-normal text-slate-600">({items.length})</span></h2>
            {items.length === 0 ? <p className="mt-2 text-sm text-slate-600">Nothing in this group.</p> : (
              <ul className="divide-y divide-slate-200">
                {shown.map((v) => <VisitRow key={v.household.id} visit={v} onComplete={() => { setTarget(v); setError(null); }} />)}
              </ul>
            )}
            {b === 4 && items.length > UPCOMING_LIMIT && (
              <button className="btn-secondary mt-2" onClick={() => setShowAllUpcoming(!showAllUpcoming)}>{showAllUpcoming ? 'Show fewer' : `Show all ${items.length}`}</button>
            )}
          </section>
        );
      })}

      <section className="card" aria-labelledby="notes-h">
        <h2 id="notes-h" className="font-display text-lg font-bold text-brand-900">Recent visit notes</h2>
        {recentNotes.length === 0 ? <EmptyState title="No notes yet" hint="Complete a visit and add a note." /> : (
          <ul className="mt-2 divide-y divide-slate-200 text-sm">
            {recentNotes.map((n) => <li key={n.id} className="py-2"><strong>{n.householdId}</strong> · {new Date(n.createdAt).toLocaleString()}<br />{n.text}</li>)}
          </ul>
        )}
      </section>

      {target && (
        <Modal title={`Complete ${target.household.id}`} onClose={() => setTarget(null)}>
          {error && <ErrorBanner message={error} />}
          <p className="mb-2 text-sm">{target.household.visitType} · {target.household.village}</p>
          <label><span className="label">Visit note (optional, synthetic data only)</span>
            <textarea className="field min-h-[110px]" maxLength={APP_CONFIG.limits.noteChars} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button className="btn-primary mt-3 w-full" onClick={() => void confirm()}>Save and mark completed</button>
        </Modal>
      )}
    </>
  );
}
