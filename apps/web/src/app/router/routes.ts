import { computed, reatomRoute } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { homeRouteDefinition } from '@pages/home/route';
import { eventTypeRouteDefinition } from '@pages/event-type/route';
import { bookingRouteDefinition } from '@pages/booking/route';

// ============================================
// LAYOUT ROUTE
// ============================================

/**
 * Тип для outlet функции
 */
interface LayoutOutlet {
  outlet: () => RouteChild;
}

/**
 * Корневой layout-маршрут без пути
 * Все остальные маршруты являются вложенными (nested)
 * Рендерит outlet для отображения активных дочерних маршрутов
 */
export const layoutRoute = reatomRoute({
  render({ outlet }: LayoutOutlet): RouteChild {
    return outlet();
  },
});

// ============================================
// NESTED ROUTES
// ============================================

/**
 * Home route - главная страница со списком типов событий
 * Путь: /
 */
export const homeRoute = layoutRoute.reatomRoute(homeRouteDefinition);

/**
 * Event type route - страница типа события с доступными слотами
 * Путь: /event-types/:id
 */
export const eventTypeRoute = layoutRoute.reatomRoute(eventTypeRouteDefinition);

/**
 * Booking route - страница бронирования
 * Путь: /bookings/new
 */
export const bookingRoute = layoutRoute.reatomRoute(bookingRouteDefinition);

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
 * Returns the rendered content from the layout route
 * Usage: <div>{appRender()}</div>
 */
export const appRender = computed(() => {
  // Render from layoutRoute which serves as the root layout
  // It will render its children (homeRoute, eventTypeRoute, bookingRoute) when matched
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
    eventTypeRoute.loader.pending() ||
    bookingRoute.loader.pending()
  );
}, 'isAnyRouteLoading');
