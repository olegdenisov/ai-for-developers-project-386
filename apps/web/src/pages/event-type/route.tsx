import { wrap, atom, computed } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { z } from 'zod';
import { PublicApi } from '@calendar-booking/api-client';
import { EventTypePage } from './EventTypePage';
import type { EventType } from '@entities/event-type';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// EVENT TYPE ROUTE DEFINITION
// ============================================

/**
 * Тип для params в loader
 */
interface RouteParams {
  id: string;
}

/**
 * Тип для self параметра в render функции
 */
interface RouteSelf {
  loader: {
    pending: () => boolean;
    data: () => { eventType: EventType } | null;
    error: () => Error | null;
  };
}

/**
 * Определение event type route для использования с layoutRoute.reatomRoute()
 * Путь: 'event-types/:id'
 */
export const eventTypeRouteDefinition = {
  path: 'event-types/:id',
  
  /**
   * Валидация параметров с помощью Zod
   */
  params: z.object({
    id: z.string().uuid(),
  }),
  
  /**
   * Loader загружает детали типа события
   */
  async loader(params: RouteParams): Promise<{ eventType: EventType }> {
    const eventTypeResponse = await wrap(api.getPublicEventType(params.id));
    if (!eventTypeResponse.ok) {
      throw new Error('Failed to fetch event type');
    }
    const eventType: EventType = await wrap(eventTypeResponse.json());
    
    return { eventType };
  },
  
  /**
   * Render function возвращает React компонент
   */
  render(self: RouteSelf): RouteChild {
    const isPending = self.loader.pending();
    const data = self.loader.data();
    const error = self.loader.error();
    
    if (isPending) {
      return <EventTypePage isLoading={true} />;
    }
    
    if (error) {
      return <EventTypePage isLoading={false} error={error.message} />;
    }
    
    if (!data) {
      return <EventTypePage isLoading={false} error="Event type not found" />;
    }
    
    return (
      <EventTypePage 
        eventType={data.eventType}
        isLoading={false}
      />
    );
  },
};

// ============================================
// SLOTS COMPUTED
// ============================================

/**
 * Atom для хранения выбранной даты в маршруте
 * Используется slotsForDate computed
 */
export const selectedDateForRoute = atom<Date | null>(null, 'selectedDateForRoute');

/**
 * Computed для загрузки доступных слотов на выбранную дату
 * Отдельно от loader маршрута, чтобы не перезагружать event type при смене даты
 */
export const slotsForDate = computed(async () => {
  // Получаем текущий URL и извлекаем id из него
  const pathname = window.location.pathname;
  const match = pathname.match(/\/event-types\/([^/]+)/);
  const eventTypeId = match ? match[1] : null;
  
  if (!eventTypeId) return [];
  
  const selectedDate = selectedDateForRoute();
  if (!selectedDate) return [];
  
  // Вычисляем диапазон дат (начало недели до конца недели)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  const response = await wrap(api.getAvailableSlotsForEventType(
    eventTypeId,
    startDate,
    endDate
  ));
  
  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }
  
  return await wrap(response.json());
}, 'slotsForDate').extend((target: { retry: () => void }) => ({
  retry() {
    target.retry();
  },
}));

// ============================================
// EXPORTS
// ============================================

export type EventTypeRouteDefinition = typeof eventTypeRouteDefinition;
