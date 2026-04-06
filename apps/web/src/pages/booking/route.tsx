import { reatomRoute, wrap, action, atom } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { BookingPage } from './BookingPage';
import { bookingFormSchema, type BookingFormData } from '@features/create-booking';
import type { Booking } from '@entities/booking';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// BOOKING CONTEXT ATOMS (for passing data between routes)
// ============================================

/**
 * Atom to store selected event type for booking
 * Set by EventTypePage when user selects a slot and continues
 */
export const bookingEventTypeAtom = atom<EventType | null>(null, 'bookingEventType');

/**
 * Atom to store selected slot for booking
 */
export const bookingSlotAtom = atom<Slot | null>(null, 'bookingSlot');

// ============================================
// BOOKING ROUTE
// ============================================

/**
 * Booking route - displays booking form and handles submission
 * Path: /bookings/new
 */
export const bookingRoute = reatomRoute({
  path: '/bookings/new',
  
  /**
   * Params function checks if required data is available
   * Redirects back to home if no event type or slot selected
   */
  params() {
    const eventType = bookingEventTypeAtom();
    const slot = bookingSlotAtom();
    
    // Block route if required data is missing
    if (!eventType || !slot) {
      return null;
    }
    
    return { eventType, slot };
  },
  
  /**
   * Render function returns React component
   */
  render(self): RouteChild {
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
});

// ============================================
// BOOKING SUBMISSION ACTION
// ============================================

/**
 * Action to submit booking form
 * Called from BookingPage component
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
  
  // Clear booking context after successful creation
  bookingEventTypeAtom.set(null);
  bookingSlotAtom.set(null);
  
  return booking;
}, 'submitBooking');

// ============================================
// EXPORTS
// ============================================

export type BookingRoute = typeof bookingRoute;
