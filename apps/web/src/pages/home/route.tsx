import { wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { HomePage } from './HomePage';
import type { EventType } from '@entities/event-type';

// ============================================
// HOME ROUTE
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
 * Home route - главная страница
 * Путь: '/' (корневой путь)
 * Page route - рендерится только при exact match
 */
export const homeRoute = layoutRoute.reatomRoute({
  path: '',

  /**
   * Loader загружает список доступных типов событий
   */
  async loader(): Promise<EventType[]> {
    const response = await wrap(apiClient.listPublicEventTypes());
    if (!response.ok) {
      throw new Error('Failed to fetch event types');
    }
    const data = await wrap(response.json());
    return data.eventTypes || [];
  },

  /**
   * Render function возвращает React компонент
   */
  render(self: RouteSelf): RouteChild {
    const isPending = self.loader.pending();
    const eventTypes = self.loader.data();
    const error = self.loader.error();

    return (
      <HomePage
        eventTypes={eventTypes || []}
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});

// ============================================
// EXPORTS
// ============================================

export { HomePage } from './HomePage';
