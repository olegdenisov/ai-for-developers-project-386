import { wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { HomePage } from './HomePage';
import type { EventType } from '@entities/event-type';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// HOME ROUTE DEFINITION
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
 * Определение home route для использования с layoutRoute.reatomRoute()
 * Путь: '' (корневой путь относительно layout)
 */
export const homeRouteDefinition = {
  path: '',
  
  /**
   * Loader загружает список доступных типов событий
   */
  async loader(): Promise<EventType[]> {
    const response = await wrap(api.listPublicEventTypes());
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
};

// ============================================
// EXPORTS
// ============================================

export type HomeRouteDefinition = typeof homeRouteDefinition;
