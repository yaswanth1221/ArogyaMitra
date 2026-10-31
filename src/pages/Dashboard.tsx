import { useMemo, useState, type ReactNode } from 'react';
import { DemoBadge, EmptyState, PriorityBadge } from '../components/ui';
import { overdueText } from '../components/PlanFormatting';
import { BUCKET_LABELS, planVisits } from '../core/priority';
import { useAppData } from '../state/AppContext';
import { logger } from '../utils/logger';
import { downloadExcelReport } from '../utils/excelReport';

type MetricTone = 'indigo' | 'violet' | 'mint' | 'coral';

function MetricCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  tone: MetricTone;
  icon: ReactNode;
}) {
  const styles: Record<MetricTone, { icon: string; surface: string; accent: string; value: string }> = {
    indigo: { icon: 'bg-white text-indigo-700', surface: 'bg-gradient-to-br from-indigo-50 to-violet-100', accent: 'bg-indigo-600', value: 'text-indigo-900' },
    violet: { icon: 'bg-white text-violet-700', surface: 'bg-gradient-to-br from-violet-50 to-fuchsia-100', accent: 'bg-violet-600', value: 'text-violet-900' },
    mint: { icon: 'bg-white text-emerald-700', surface: 'bg-gradient-to-br from-emerald-50 to-teal-100', accent: 'bg-emerald-600', value: 'text-emerald-900' },
    coral: { icon: 'bg-white text-rose-700', surface: 'bg-gradient-to-br from-rose-50 to-orange-100', accent: 'bg-rose-600', value: 'text-rose-900' },
  };
  const style = styles[tone];

  return (
    <article className={`relative overflow-hidden rounded-3xl border border-slate-200 ${style.surface} p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className={`mt-2 font-display text-4xl font-bold tracking-tight ${style.value}`}>{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.icon}`} aria-hidden="true">
          {icon}
        </span>
      </div>
    </article>
  );
}

function MetricIcon({ type }: { type: 'home' | 'calendar' | 'clock' | 'check' }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[type]}
    </svg>
  );
}

export function Dashboard() {
  const { households, notes, chat, weights, today } = useAppData();
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const plan = useMemo(() => planVisits(households, today, weights), [households, weights, today]);
  const overdue = plan.filter((p) => p.overdueDays > 0).length;
  const dueToday = plan.filter((p) => p.household.dueDate === today).length;
  const completedToday = households.filter((h) => h.status === 'Completed' && h.completedAt === today).length;
  const scheduledToday = dueToday + completedToday;
  const completionPercent = scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 0;
  const highPriority = plan.filter((p) => p.household.priority === 'High').length;
  const displayDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${today}T00:00:00`));

  const fieldPulse = useMemo(() => {
    const urgent = plan.filter((p) => p.household.priority === 'High').slice(0, 3);
    const villages = Array.from(
      plan.reduce((map, item) => {
        const location = item.household.village;
        const current = map.get(location) ?? { name: location, count: 0, overdue: 0 };
        current.count += 1;
        if (item.overdueDays > 0) current.overdue += 1;
        map.set(location, current);
        return map;
      }, new Map<string, { name: string; count: number; overdue: number }>()),
    )
      .map(([, value]) => value)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 3);

    return { urgent, villages };
  }, [plan]);

  const exportReport = () => {
    try {
      downloadExcelReport(households, plan, notes, today, chat, weights);
      setReportMessage('Excel report downloaded.');
    } catch (error) {
      logger.error('Excel report download failed.', error);
      setReportMessage('Could not create the Excel report. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-2">
      <section className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#18294e] via-[#233d9a] to-[#1fa0c8] p-5 text-white shadow-soft sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[42px] border-cyan-200/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 right-10 -z-10 h-64 w-64 rounded-full bg-emerald-300/10" aria-hidden="true" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-cyan-50">
                AROGYAMITRA · FIELD TEAM
              </span>
              <DemoBadge>Synthetic demo records</DemoBadge>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Today at a glance</h1>
                <p className="mt-2 text-sm text-cyan-50 sm:text-base">{displayDate}</p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <svg className="h-[90px] w-[90px] -rotate-90" viewBox="0 0 100 100" role="img" aria-label={`${completionPercent}% of today's visits completed`}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={String(2 * Math.PI * 42)}
                    strokeDashoffset={String(2 * Math.PI * 42 * (1 - completionPercent / 100))}
                  />
                  <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="21" fontWeight="700" className="rotate-90" style={{ transformOrigin: '50% 50%' }}>
                    {completionPercent}%
                  </text>
                </svg>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">Visits done</p>
                  <p className="mt-1 font-display text-2xl font-bold">{completedToday}<span className="ml-1 text-base font-medium text-cyan-100">/ {scheduledToday}</span></p>
                  <p className="text-xs text-cyan-100">scheduled today</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#/planner" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-200">
                Open today’s visit plan
              </a>
              <a href="#/households" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
                Find a household
              </a>
              <button type="button" onClick={exportReport} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5M12 15V3" />
                </svg>
                Download report
              </button>
            </div>
          </div>
        </div>

        <aside className="section-shell bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">Field Pulse</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">Risk overview</h2>
            </div>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700">Live</span>
          </div>

          <div className="mt-5 space-y-3">
            {fieldPulse.urgent.length > 0 ? (
              fieldPulse.urgent.map((item, index) => (
                <div key={item.household.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.household.village}</p>
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{index + 1}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.household.visitType} · {item.household.id}</p>
                  <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-rose-700">High priority</span>
                    <span className="text-slate-500">{item.overdueDays}d overdue</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No urgent household alerts today.</div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Village watch</p>
            <ul className="mt-3 space-y-2">
              {fieldPulse.villages.map((village) => (
                <li key={village.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-700">{village.name}</span>
                  <span className="text-slate-500">{village.overdue} overdue</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {reportMessage && (
        <p className="text-sm font-semibold text-brand-800" role="status" aria-live="polite">
          {reportMessage}
        </p>
      )}

      <section aria-label="Visit summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registered households" value={households.length} hint="In the local register" tone="indigo" icon={<MetricIcon type="home" />} />
        <MetricCard label="Due today" value={dueToday} hint="Pending visits scheduled today" tone="violet" icon={<MetricIcon type="calendar" />} />
        <MetricCard label="Overdue visits" value={overdue} hint="Past due and requiring attention" tone="coral" icon={<MetricIcon type="clock" />} />
        <MetricCard label="Completed today" value={completedToday} hint={`${highPriority} high-priority cases still pending`} tone="mint" icon={<MetricIcon type="check" />} />
      </section>

      <section className="section-shell" aria-labelledby="top-visits">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">Prioritized for follow-up</p>
            <h2 id="top-visits" className="mt-1 font-display text-xl font-bold text-slate-900">Next visits to make</h2>
          </div>
          <a href="#/planner" className="text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-4 hover:text-brand-900">
            View full plan
          </a>
        </div>
        {plan.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState title="No pending visits" hint="Add a household or reset demo data in Settings." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {plan.slice(0, 6).map((p, index) => (
              <li key={p.household.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-rose-100 text-rose-700' : 'bg-brand-50 text-brand-700'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {p.household.village} <span className="font-normal text-slate-400">·</span> {p.household.visitType}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {p.household.id} <span className="text-slate-400">·</span> {BUCKET_LABELS[p.bucket]}
                      {overdueText(p.overdueDays) && <span className="font-semibold text-rose-700"> · {overdueText(p.overdueDays)}</span>}
                    </p>
                  </div>
                </div>
                <PriorityBadge priority={p.household.priority} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Dashboard shortcuts">
        <a href="#/assistant" className="group rounded-3xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-100">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">Quick support</span>
          <span className="mt-1 block font-display text-lg font-bold text-brand-900">Ask the health assistant <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
          <span className="mt-1 block text-sm text-slate-600">Find information from the local protocol library.</span>
        </a>

        <a href="#/households" className="group rounded-3xl border border-violet-200 bg-violet-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-100">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">Household register</span>
          <span className="mt-1 block font-display text-lg font-bold text-slate-900">Search or update records <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span></span>
          <span className="mt-1 block text-sm text-slate-600">Open household details and visit history.</span>
        </a>
      </nav>
    </div>
  );
}
