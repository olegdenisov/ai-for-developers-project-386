import type { RouteChild } from '@reatom/core';
import { createElement, Fragment } from 'react';
import { layoutRoute } from '@shared/router';
import { upcomingBookings, pastBookings } from '@features/owner-bookings';
import { AdminLayout } from '../AdminLayout';
import { AdminBookingsPage } from '../AdminBookingsPage';
import { AdminEventTypesPage } from '../AdminEventTypesPage';

// ============================================
// ADMIN ROUTE (layout)
// ============================================

/**
 * Корневой layout-маршрут для раздела администратора
 * Путь: '/admin'
 * Рендерит AdminLayout с боковой панелью навигации
 */
export const adminRoute = layoutRoute.reatomRoute({
  path: 'admin',

  render(self): RouteChild {
    const children = self.outlet();

    // Если нет активных дочерних роутов — перенаправляем на бронирования
    if (!children || children.length === 0) {
      adminBookingsRoute.go();
      return createElement(Fragment);
    }

    return <AdminLayout>{children.at(-1)}</AdminLayout>;
  },
});

// ============================================
// ADMIN BOOKINGS ROUTE
// ============================================

/**
 * Страница управления бронированиями
 * Путь: '/admin/bookings'
 */
export const adminBookingsRoute = adminRoute.reatomRoute({
  path: 'bookings',

  // Обновляем данные при каждой активации маршрута
  async loader() {
    upcomingBookings.retry();
    pastBookings.retry();
  },

  render(): RouteChild {
    return <AdminBookingsPage />;
  },
});

// ============================================
// ADMIN EVENT TYPES ROUTE
// ============================================

/**
 * Страница управления типами событий
 * Путь: '/admin/event-types'
 */
export const adminEventTypesRoute = adminRoute.reatomRoute({
  path: 'event-types',

  render(): RouteChild {
    return <AdminEventTypesPage />;
  },
});
