import { computed } from '@reatom/core';
import { homeRoute } from '@pages/home';
import { eventTypeRoute } from '@pages/event-type';
import { bookingRoute } from '@pages/booking';

// ============================================
// ROUTE REGISTRY
// ============================================

/**
 * All routes are automatically registered in urlAtom.routes
 * We just re-export them here for convenience
 */
export { homeRoute, eventTypeRoute, bookingRoute };

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Navigation helpers for programmatic navigation
 * These are convenience wrappers around route.go() methods
 */
export const navigate = {
  home: () => homeRoute.go(),
  eventType: (id: string) => eventTypeRoute.go({ id }),
  booking: () => bookingRoute.go(),
  back: () => window.history.back(),
};

// ============================================
// APP RENDER
// ============================================

/**
 * Main app render computed
 * Returns the rendered content from the root route
 * Usage: <div>{appRender()}</div>
 */
export const appRender = computed(() => {
  // Render from homeRoute which serves as the root layout
  // It will render its children (eventTypeRoute, bookingRoute) when matched
  return homeRoute.render();
}, 'appRender');

// ============================================
// GLOBAL LOADING STATE
// ============================================

/**
 * Computed that tracks if any route loader is pending
 * Useful for global loading indicators
 */
export const isAnyRouteLoading = computed(() => {
  return (
    homeRoute.loader.pending() ||
    eventTypeRoute.loader.pending() ||
    bookingRoute.loader.pending()
  );
}, 'isAnyRouteLoading');
