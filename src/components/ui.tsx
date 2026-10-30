import { useEffect, useRef, type ReactNode } from 'react';
import type { ResponseCategory } from '../types';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-700">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: string | number; hint?: string; tone?: 'default' | 'warn' | 'alert' }) {
  const border = { default: 'border-brand-500', warn: 'border-saffron-500', alert: 'border-alert-600' }[tone];
  return (
    <div className={`card border-l-4 ${border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

export function DemoBadge({ children = 'DEMO DATA' }: { children?: ReactNode }) {
  return null;
}

const CATEGORY_STYLE: Record<ResponseCategory, { label: string; cls: string }> = {
  ANSWER: { label: 'ANSWER', cls: 'bg-brand-700 text-white' },
  REFUSE: { label: 'REFUSE', cls: 'bg-saffron-500 text-ink' },
  REFER_NOW: { label: 'REFER NOW', cls: 'bg-alert-600 text-white' },
};

export function CategoryBadge({ category }: { category: ResponseCategory }) {
  const { label, cls } = CATEGORY_STYLE[category];
  return <span className={`inline-block rounded px-2.5 py-1 text-xs font-extrabold tracking-wider ${cls}`}>{label}</span>;
}

const PRIORITY_CLS = { High: 'bg-alert-50 text-alert-700 border-alert-600', Medium: 'bg-saffron-100 text-saffron-700 border-saffron-500', Low: 'bg-slate-100 text-slate-700 border-slate-400' };

export function PriorityBadge({ priority }: { priority: keyof typeof PRIORITY_CLS }) {
  return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${PRIORITY_CLS[priority]}`}>{priority}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-400 p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-alert-600 bg-alert-50 p-3 text-sm text-alert-900">
      <span>{message}</span>
      {onDismiss && <button type="button" className="font-semibold underline" onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-brand-900">{title}</h2>
          <button type="button" className="text-sm font-semibold text-slate-600" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
