import { useEffect, useState } from 'react';

export const ROUTES = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'assistant', label: 'Assistant' },
  { path: 'households', label: 'Households' },
  { path: 'planner', label: 'Visit Planner' },
  { path: 'protocols', label: 'Protocols' },
  { path: 'safety', label: 'Safety & Performance' },
  { path: 'settings', label: 'Settings' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];

function read(): RoutePath {
  const hash = window.location.hash.replace('#/', '');
  return ROUTES.find((r) => r.path === hash)?.path ?? 'dashboard';
}

export function useHashRoute(): RoutePath {
  const [route, setRoute] = useState<RoutePath>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
