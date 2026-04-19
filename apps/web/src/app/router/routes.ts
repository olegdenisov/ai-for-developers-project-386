import { computed, wrap } from '@reatom/core';
import { layoutRoute } from '@shared/router';
import { homeRoute } from '@pages/home';
import { bookingRoute } from '@pages/booking';
import { bookCatalogRoute } from '@pages/book-catalog';
import { eventTypeRoute } from '@pages/event-type';
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
export { eventTypeRoute } from '@pages/event-type';
export { bookingConfirmationRoute } from '@pages/booking-confirmation';
export { bookingDetailRoute } from '@pages/booking-detail';
export { adminRoute, adminBookingsRoute, adminEventTypesRoute } from '@pages/admin';

// ============================================
// NAVIGATION HELPERS
// ============================================

export const navigate = {
  home: () => wrap(homeRoute.go()),
  booking: () => wrap(bookCatalogRoute.go()),
  eventType: (eventTypeId: string) => wrap(eventTypeRoute.go({ eventTypeId })),
  bookingConfirmation: (eventTypeId: string, slotId: string) => {
    // reatom не выводит тип search params из Zod v4 в .go(), обходим через переменную
    const params = { eventTypeId, slotId };
    return wrap(bookingConfirmationRoute.go(params));
  },
  bookingDetail: (id: string) => wrap(bookingDetailRoute.go({ id })),
  admin: () => wrap(adminBookingsRoute.go()),
  back: () => window.history.back(),
};

// ============================================
// APP RENDER
// ============================================

export const appRender = computed(() => {
  return layoutRoute.render();
}, 'appRender');

// ============================================
// GLOBAL LOADING STATE
// ============================================

export const isAnyRouteLoading = computed(() => {
  return (
    homeRoute.loader.pending() ||
    bookingRoute.loader.pending() ||
    bookCatalogRoute.loader.pending() ||
    eventTypeRoute.loader.pending() ||
    bookingConfirmationRoute.loader.pending() ||
    bookingDetailRoute.loader.pending() ||
    adminRoute.loader.pending() ||
    adminBookingsRoute.loader.pending() ||
    adminEventTypesRoute.loader.pending()
  );
}, 'isAnyRouteLoading');
