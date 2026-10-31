import { useState, type ReactNode } from 'react';
import { ROUTES, type RoutePath } from '../hooks/useHashRoute';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppData } from '../state/AppContext';
import { DemoBadge } from './ui';

export function Layout({ route, children }: { route: RoutePath; children: ReactNode }) {
  const online = useOnlineStatus();
  const { pendingSync } = useAppData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-brand-900 via-brand-900 to-[#162750] p-5 text-white lg:flex">
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <img src={`${import.meta.env.BASE_URL}arogyamitra-logo.svg`} alt="" className="h-8 w-8" />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none">ArogyaMitra</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-100/80">Field care</p>
          </div>
        </div>

        <nav aria-label="Main" className="mt-6 flex flex-col gap-2">
          {ROUTES.map((r) => (
            <a
              key={r.path}
              href={`#/${r.path}`}
              aria-current={route === r.path ? 'page' : undefined}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-all ${
                route === r.path
                  ? 'bg-white text-brand-900 shadow-lg shadow-brand-900/15'
                  : 'text-brand-50/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              {r.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-100/70">Status</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm text-brand-50/90">Work mode</span>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${online ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}>
              {online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-semibold text-brand-900 shadow-sm lg:hidden"
                aria-label="Open dashboard menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="flex flex-col gap-1">
                  <span className="block h-0.5 w-4 rounded-full bg-brand-900" />
                  <span className="block h-0.5 w-4 rounded-full bg-brand-900" />
                  <span className="block h-0.5 w-4 rounded-full bg-brand-900" />
                </span>
                Menu
              </button>

              <div className="flex items-center gap-2 lg:hidden">
                <img src={`${import.meta.env.BASE_URL}arogyamitra-logo.svg`} alt="" className="h-8 w-8 rounded-lg" />
                <span className="font-display text-base font-bold text-brand-900">ArogyaMitra</span>
              </div>

              <DemoBadge />
            </div>

            <div className="flex items-center gap-3 text-sm" aria-live="polite">
              {pendingSync > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{pendingSync} queued</span>}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-x-4 bottom-20 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">Sections</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ROUTES.map((r) => (
                <a
                  key={r.path}
                  href={`#/${r.path}`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={route === r.path ? 'page' : undefined}
                  className={`rounded-2xl px-3 py-3 text-center text-xs font-semibold ${route === r.path ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {r.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-slate-200 bg-white/90 backdrop-blur-lg lg:hidden">
        {ROUTES.map((r) => (
          <a
            key={r.path}
            href={`#/${r.path}`}
            aria-current={route === r.path ? 'page' : undefined}
            className={`flex min-h-[56px] min-w-[84px] flex-1 items-center justify-center px-2 text-center text-[11px] font-bold ${route === r.path ? 'border-t-4 border-brand-700 bg-brand-50 text-brand-800' : 'text-slate-600'}`}
          >
            {r.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
