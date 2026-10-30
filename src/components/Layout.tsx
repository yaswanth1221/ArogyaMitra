import type { ReactNode } from 'react';
import { ROUTES, type RoutePath } from '../hooks/useHashRoute';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppData } from '../state/AppContext';
import { DemoBadge } from './ui';

export function Layout({ route, children }: { route: RoutePath; children: ReactNode }) {
  const online = useOnlineStatus();
  const { pendingSync } = useAppData();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 p-4 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}arogyamitra-logo.svg`} alt="" className="h-10 w-10 rounded-xl" />
          <p className="font-display text-xl font-bold">ArogyaMitra</p>
        </div>
        <p className="mb-6 text-xs text-brand-200">Health-worker companion</p>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {ROUTES.map((r) => (
            <a key={r.path} href={`#/${r.path}`} aria-current={route === r.path ? 'page' : undefined}
              className={`rounded-md px-3 py-2.5 text-sm font-medium ${route === r.path ? 'bg-white text-brand-900' : 'text-brand-100 hover:bg-brand-800'}`}>
              {r.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 font-display text-base font-bold text-brand-900 lg:hidden">
              <img src={`${import.meta.env.BASE_URL}arogyamitra-logo.svg`} alt="" className="h-8 w-8 rounded-lg" />
              ArogyaMitra
            </span>
            <DemoBadge />
          </div>
          <div className="flex items-center gap-3 text-sm" aria-live="polite">
            {pendingSync > 0 && <span className="text-slate-700">{pendingSync} change(s) queued</span>}
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${online ? 'bg-brand-100 text-brand-800' : 'bg-saffron-500 text-ink'}`}>
              {online ? 'Online' : 'Offline - working locally'}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-6">{children}</main>
      </div>

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-300 bg-white lg:hidden">
        {ROUTES.map((r) => (
          <a key={r.path} href={`#/${r.path}`} aria-current={route === r.path ? 'page' : undefined}
            className={`flex min-h-[56px] min-w-[84px] flex-1 items-center justify-center px-2 text-center text-xs font-semibold ${route === r.path ? 'border-t-4 border-brand-700 text-brand-800' : 'border-t-4 border-transparent text-slate-700'}`}>
            {r.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
