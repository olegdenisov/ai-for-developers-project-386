import type { RouteChild } from '@reatom/core';
import { bookCatalogRoute } from '@pages/book-catalog/model/route';
import { bookingRoute } from '@pages/booking';
import { EventTypePage } from '../EventTypePage';
import {
  selectedEventTypeIdAtom,
  selectedDateAtom,
  selectedSlotAtom,
  selectedSlotIdAtom,
  slotsAtom,
} from './route';
import type { EventType } from '@entities/event-type';

/**
 * Маршрут страницы выбора слота для конкретного типа события.
 * Путь: /bookings/new/:eventTypeId
 * Сбрасывает предыдущий выбор при навигации.
 */
export const eventTypeRoute = bookCatalogRoute.reatomRoute({
  path: ':eventTypeId',

  async loader({ eventTypeId }: { eventTypeId: string }): Promise<EventType | null> {
    // Устанавливаем ID типа события для компонентов, читающих atom
    selectedEventTypeIdAtom.set(eventTypeId);
    // Сбрасываем предыдущий выбор
    selectedDateAtom.set(null);
    selectedSlotAtom.set(null);
    selectedSlotIdAtom.set(null);
    slotsAtom.set([]);

    // Ищем event type в данных parent loader'а (список уже загружен bookCatalogRoute)
    const eventTypes = bookCatalogRoute.loader.data() ?? [];
    const found = eventTypes.find((et) => et.id === eventTypeId);
    return found ?? null;
  },

  render(self): RouteChild {
    const eventType = self.loader.data() ?? undefined;
    const owner = bookingRoute.loader.data() ?? undefined;
    return <EventTypePage eventTypeId={self().eventTypeId} eventType={eventType} owner={owner} />;
  },
});
