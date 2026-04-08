import { atom, action } from '@reatom/core';

export type Route = 'home' | 'guest' | 'owner';

export const routeAtom = atom<Route>('home', 'routeAtom');

export const navigate = action((ctx, route: Route) => {
  routeAtom(ctx, route);
  // Update browser URL without page reload
  const path = route === 'home' ? '/' : `/${route}`;
  window.history.pushState({}, '', path);
}, 'navigate');

// Initialize route from URL on load
if (typeof window !== 'undefined') {
  const path = window.location.pathname.slice(1) || 'home';
  if (['home', 'guest', 'owner'].includes(path)) {
    routeAtom({}, path as Route);
  }
}

// Handle browser back/forward
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const path = window.location.pathname.slice(1) || 'home';
    if (['home', 'guest', 'owner'].includes(path)) {
      routeAtom({}, path as Route);
    }
  });
}