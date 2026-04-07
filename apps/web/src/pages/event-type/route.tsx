import { wrap, atom, computed, withAsync, action } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { z } from 'zod';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { EventTypePage } from './EventTypePage';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';
import type { Slot } from '@entities/slot';

// ============================================
// EVENT TYPE ROUTE
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
    data: () => { eventType: EventType; owner: Owner } | null;
    error: () => Error | null;
  };
}

/**
 * Atom для хранения текущего месяца календаря
 * Используется для навигации по месяцам в календаре
 */
export const currentCalendarMonthAtom = atom<Date>(new Date(), 'currentCalendarMonth');

/**
 * Event type route - страница выбора слотов для типа события
 * Путь: '/event-types/:id'
 * Page route - рендерится только при exact match
 */
export const eventTypeRoute = layoutRoute.reatomRoute({
  path: 'event-types/:id',

  /**
   * Валидация параметров с помощью Zod
   */
  params: z.object({
    id: z.string().uuid(),
  }),

  /**
   * Loader загружает детали типа события и информацию о владельце
   */
  async loader(params: RouteParams): Promise<{ eventType: EventType; owner: Owner }> {
    // Загружаем тип события
    const eventTypeResponse = await wrap(apiClient.getPublicEventType(params.id));
    if (!eventTypeResponse.ok) {
      throw new Error('Failed to fetch event type');
    }
    const eventType: EventType = await wrap(eventTypeResponse.json());

    // Загружаем информацию о владельце (необязательно)
    let owner: Owner;
    try {
      const ownerResponse = await wrap(apiClient.getOwnerProfile());
      if (ownerResponse.ok) {
        owner = await wrap(ownerResponse.json());
      } else {
        // Fallback значение при неуспешном ответе
        owner = { id: 'default', name: 'Host', email: '', isPredefined: true, createdAt: '' };
      }
    } catch {
      // Fallback значение при ошибке
      owner = { id: 'default', name: 'Host', email: '', isPredefined: true, createdAt: '' };
    }

    return { eventType, owner };
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
        owner={data.owner}
        isLoading={false}
      />
    );
  },
});

// ============================================
// SLOTS COMPUTED
// ============================================

/**
 * Atom для хранения выбранной даты в маршруте
 * Используется fetchSlotsForDate action
 */
export const selectedDateForRoute = atom<Date | null>(null, 'selectedDateForRoute');

/**
 * Atom для хранения загруженных слотов
 */
export const slotsAtom = atom<Slot[]>([], 'slotsAtom');

/**
 * Action для загрузки доступных слотов на выбранную дату
 * Отдельно от loader маршрута, чтобы не перезагружать event type при смене даты
 */
export const fetchSlotsForDate = action(async () => {
  // Получаем текущий URL и извлекаем id из него
  const pathname = window.location.pathname;
  const match = pathname.match(/\/event-types\/([^/]+)/);
  const eventTypeId = match ? match[1] : null;

  if (!eventTypeId) {
    slotsAtom.set([]);
    return [];
  }

  const selectedDate = selectedDateForRoute();
  if (!selectedDate) {
    slotsAtom.set([]);
    return [];
  }

  // Вычисляем диапазон дат (начало недели до конца недели)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  const response = await wrap(apiClient.getAvailableSlotsForEventType(
    eventTypeId,
    startDate,
    endDate
  ));

  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }

  const slots = await wrap(response.json());
  slotsAtom.set(slots);
  return slots;
}, 'fetchSlotsForDate').extend(withAsync());

/**
 * Computed для отслеживания состояния загрузки слотов
 */
export const isSlotsLoading = computed(() => {
  return fetchSlotsForDate.pending();
}, 'isSlotsLoading');

// ============================================
// EXPORTS
// ============================================

export { EventTypePage } from './EventTypePage';
