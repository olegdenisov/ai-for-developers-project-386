import { wrap, action, atom } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { BookCatalogPage } from './BookCatalogPage';
import type { BookingFormData } from '@features/create-booking';
import type { Booking } from '@entities/booking';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

// ============================================
// BOOKING CONTEXT ATOMS
// ============================================

/**
 * Atom для хранения выбранного типа события при бронировании
 * Устанавливается когда пользователь выбирает тип события на странице каталога
 */
export const bookingEventTypeAtom = atom<EventType | null>(null, 'bookingEventType');

/**
 * Atom для хранения выбранного слота при бронировании
 */
export const bookingSlotAtom = atom<Slot | null>(null, 'bookingSlot');

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

// ============================================
// BOOKING SUBMISSION ACTION
// ============================================

/**
 * Action для отправки формы бронирования
 * Используется на странице подтверждения бронирования
 */
export const submitBooking = action(async (formData: BookingFormData) => {
  const eventType = bookingEventTypeAtom();
  const slot = bookingSlotAtom();

  if (!eventType || !slot) {
    throw new Error('Event type or slot not selected');
  }

  const response = await wrap(apiClient.createBooking({
    eventTypeId: eventType.id,
    slotId: slot.id,
    guestName: formData.guestName,
    guestEmail: formData.guestEmail,
    guestNotes: formData.guestNotes,
  }));

  if (!response.ok) {
    const error = await wrap(response.json());
    throw new Error(error.message || 'Failed to create booking');
  }

  const booking: Booking = await wrap(response.json());

  // Очищаем контекст бронирования после успешного создания
  bookingEventTypeAtom.set(null);
  bookingSlotAtom.set(null);

  return booking;
}, 'submitBooking');

// ============================================
// EXPORTS
// ============================================

export { BookCatalogPage } from './BookCatalogPage';
