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
}

/**
 * Book catalog route - страница каталога типов событий
 * Путь: '/bookings/new'
 * Page route - рендерится только при exact match
 */
export const bookCatalogRoute = layoutRoute.reatomRoute({
  path: 'bookings/new',

  /**
   * Loader загружает список доступных типов событий
   */
  async loader(): Promise<EventType[]> {
    const data = await wrap(apiClient.listPublicEventTypes().then(r => r.json()));

    // API возвращает { eventTypes: [...] }, но моки могут вернуть массив напрямую
    const eventTypes = Array.isArray(data) ? data : (data.eventTypes || []);

    return eventTypes;
  },

  /**
   * Render function возвращает React компонент
   */
  render(self: RouteSelf): RouteChild {
    const isPending = self.loader.pending();
    const eventTypes = self.loader.data();
    const error = self.loader.error();

    return (
      <BookCatalogPage
        eventTypes={eventTypes || []}
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});
