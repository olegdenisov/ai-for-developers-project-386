import { computed, wrap } from '@reatom/core';
import { layoutRoute } from '@shared/router';
import { homeRoute } from '@pages/home';
import { bookingRoute } from '@pages/booking';
import { bookCatalogRoute } from '@pages/book-catalog';
import { bookingConfirmationRoute } from '@pages/booking-confirmation';
import { bookingDetailRoute } from '@pages/booking-detail';
import { adminRoute, adminBookingsRoute, adminEventTypesRoute } from '@pages/admin';

// ============================================
// EXPORTS
// ============================================

export { layoutRoute } from '@shared/router';
export { homeRoute } from '@pages/home';
export { bookingRoute } from '@pages/booking';
export { bookCatalogRoute } from '@pages/book-catalog';
export { bookingConfirmationRoute } from '@pages/booking-confirmation';
export { bookingDetailRoute } from '@pages/booking-detail';
export { adminRoute, adminBookingsRoute, adminEventTypesRoute } from '@pages/admin';

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Navigation helpers for programmatic navigation
 * These are convenience wrappers around route.go() methods
 * Используют wrap() для правильной интеграции с системой эффектов Reatom
 */
export const navigate = {
  home: () => wrap(homeRoute.go()),
  booking: () => wrap(bookCatalogRoute.go()),
  bookingConfirmation: () => wrap(bookingConfirmationRoute.go()),
  bookingDetail: (id: string) => wrap(bookingDetailRoute.go({ id })),
  admin: () => wrap(adminBookingsRoute.go()),
  back: () => window.history.back(),
};

// ============================================
// APP RENDER
// ============================================

/**
 * Main app render computed
 * Returns the rendered content from the layout route
 * Usage: <div>{appRender()}</div>
 */
export const appRender = computed(() => {
  // Render from layoutRoute which serves as the root layout
  // It will render its children (homeRoute, bookCatalogRoute) when matched
  return layoutRoute.render();
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
    bookingRoute.loader.pending() ||
    bookCatalogRoute.loader.pending() ||
    bookingConfirmationRoute.loader.pending() ||
    bookingDetailRoute.loader.pending() ||
    adminRoute.loader.pending() ||
    adminBookingsRoute.loader.pending() ||
    adminEventTypesRoute.loader.pending()
  );
}, 'isAnyRouteLoading');
