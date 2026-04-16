import { wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { BookCatalogPage } from '../BookCatalogPage';
import { EventTypePage } from '@pages/event-type';
import {
  selectedEventTypeIdAtom,
  selectedDateAtom,
  selectedSlotIdAtom,
  selectedSlotAtom,
  slotsAtom,
  parseDateParam,
} from '@pages/event-type/model/route';
import type { EventType } from '@entities/event-type';

// ============================================
// BOOK CATALOG ROUTE
// ============================================

/**
 * Book catalog route - страница каталога и выбора слотов
 * Путь: '/bookings/new'
 * Layout route - рендерится при любом match, поддерживает вложенные роуты
 *
 * Отображает:
 * - Каталог типов событий (без ?eventTypeId)
 * - Выбор слота (с ?eventTypeId=<id>)
 */
export const bookCatalogRoute = layoutRoute.reatomRoute({
  path: 'bookings/new',

  /**
   * Loader инициализирует URL-атомы из query-параметров и загружает список типов событий
   */
  async loader(): Promise<EventType[]> {
    // Инициализируем URL-атомы из query-параметров при навигации
    const params = new URLSearchParams(window.location.search);

    const eventTypeId = params.get('eventTypeId');
    selectedEventTypeIdAtom.set(eventTypeId);

    const date = parseDateParam(params.get('date'));
    selectedDateAtom.set(date);

    const slotId = params.get('slotId');
    selectedSlotIdAtom.set(slotId);

    // Сбрасываем выбранный слот — он будет восстановлен из slots после загрузки
    selectedSlotAtom.set(null);
    slotsAtom.set([]);

    // Загружаем список типов событий для каталога
    const response = await wrap(apiClient.listPublicEventTypes());

    if (response.status >= 400) {
      throw new Error('Failed to fetch event types');
    }

    const eventTypes = response.data || [];
    return eventTypes;
  },

  /**
   * Render function:
   * - Если есть вложенные маршруты (confirm) — рендерим их
   * - Если выбран тип события (?eventTypeId) — рендерим пикер слотов
   * - Иначе — рендерим каталог
   */
  render(self): RouteChild {
    const { isPending, data: eventTypes } = self.loader.status()
    const error = self.loader.error();
    const children = self.outlet();

    // Если есть вложенные маршруты (страница confirm), рендерим их
    if (children && children.length > 0) {
      return children.at(-1)!; // гарантировано, т.к. children.length > 0
    }

    // Если выбран тип события — рендерим пикер слотов
    const eventTypeId = selectedEventTypeIdAtom();
    if (eventTypeId) {
      return <EventTypePage eventTypeId={eventTypeId} />;
    }

    // Иначе рендерим каталог
    return (
      <BookCatalogPage
        eventTypes={eventTypes || []}
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});
