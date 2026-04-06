import { wrap, action, atom } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { BookingPage } from './BookingPage';
import type { BookingFormData } from '@features/create-booking';
import type { Booking } from '@entities/booking';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// BOOKING CONTEXT ATOMS
// ============================================

/**
 * Atom для хранения выбранного типа события при бронировании
 * Устанавливается EventTypePage когда пользователь выбирает слот
 */
export const bookingEventTypeAtom = atom<EventType | null>(null, 'bookingEventType');

/**
 * Atom для хранения выбранного слота при бронировании
 */
export const bookingSlotAtom = atom<Slot | null>(null, 'bookingSlot');

// ============================================
// BOOKING ROUTE DEFINITION
// ============================================

/**
 * Тип для self параметра в render функции
 */
interface RouteSelf {
  (): { eventType: EventType; slot: Slot } | null;
  status: () => { isPending: boolean; error: Error | null };
}

/**
 * Определение booking route для использования с layoutRoute.reatomRoute()
 * Путь: 'bookings/new'
 */
export const bookingRouteDefinition = {
  path: 'bookings/new',
  
  /**
   * Params function проверяет наличие необходимых данных
   * Возвращает null если не выбран event type или slot
   */
  params() {
    const eventType = bookingEventTypeAtom();
    const slot = bookingSlotAtom();
    
    if (!eventType || !slot) {
      return null;
    }
    
    return { eventType, slot };
  },
  
  /**
   * Render function возвращает React компонент
   */
  render(self: RouteSelf): RouteChild {
    const params = self();
    
    if (!params) {
      return (
        <BookingPage 
          isLoading={false}
          error="Информация о бронировании не найдена. Пожалуйста, начните сначала."
        />
      );
    }
    
    return (
      <BookingPage 
        eventType={params.eventType}
        slot={params.slot}
        isLoading={false}
      />
    );
  },
};

// ============================================
// BOOKING SUBMISSION ACTION
// ============================================

/**
 * Action для отправки формы бронирования
 * Вызывается из компонента BookingPage
 */
export const submitBooking = action(async (formData: BookingFormData) => {
  const eventType = bookingEventTypeAtom();
  const slot = bookingSlotAtom();
  
  if (!eventType || !slot) {
    throw new Error('Event type or slot not selected');
  }
  
  const response = await wrap(api.createBooking({
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

export type BookingRouteDefinition = typeof bookingRouteDefinition;
