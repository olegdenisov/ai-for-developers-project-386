import { wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { BookCatalogPage } from '../BookCatalogPage';
import type { EventType } from '@entities/event-type';

// ============================================
// BOOK CATALOG ROUTE
// ============================================

/**
 * Тип для self параметра в render функции
 */
interface RouteSelf {
  loader: {
    pending: () => boolean;
    data: () => EventType[] | null;
    error: () => Error | null;
  };
  outlet: () => RouteChild[];
}

/**
 * Book catalog route - страница каталога типов событий
 * Путь: '/bookings/new'
 * Layout route - рендерится при любом match, поддерживает вложенные роуты
 */
export const bookCatalogRoute = layoutRoute.reatomRoute({
  path: 'bookings/new',
  layout: true,

  /**
   * Loader загружает список доступных типов событий
   */
  async loader(): Promise<EventType[]> {
    const response = await wrap(apiClient.listPublicEventTypes());
    
    if (response.status >= 400) {
      throw new Error('Failed to fetch event types');
    }
    
    // API возвращает { eventTypes: [...] }
    const data = response.data;
    const eventTypes = data.eventTypes || [];
    return eventTypes;
  },

  /**
   * Render function возвращает React компонент
   * Если есть вложенные маршруты (outlet), рендерит их
   * Иначе рендерит страницу каталога
   */
  render(self: RouteSelf): RouteChild {
    const isPending = self.loader.pending();
    const eventTypes = self.loader.data();
    const error = self.loader.error();
    const children = self.outlet();

    // Если есть вложенные маршруты, рендерим их
    if (children && children.length > 0) {
      return children.at(-1) ?? null;
    }

    // Иначе рендерим страницу каталога
    return (
      <BookCatalogPage
        eventTypes={eventTypes || []}
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});
