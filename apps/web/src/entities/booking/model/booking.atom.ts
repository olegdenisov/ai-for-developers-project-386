import { atom } from '@reatom/core';
import { reatomAsync } from '@reatom/async';
import { PublicApi } from '@calendar-booking/api-client';
import { Booking, CreateBookingRequest } from './booking.types';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Atom to store the current booking
export const currentBookingAtom = atom<Booking | null>(null, 'currentBooking');

// Atom to store booking creation error
export const bookingErrorAtom = atom<string | null>(null, 'bookingError');

// Async action to fetch a booking by ID
export const fetchBooking = reatomAsync(
  async (ctx, id: string) => {
    const response = await api.getBooking(id);
    if (!response.ok) {
      throw new Error('Failed to fetch booking');
    }
    const booking = await response.json();
    currentBookingAtom(ctx, booking);
    return booking;
  },
  'fetchBooking'
);

// Async action to create a booking
export const createBooking = reatomAsync(
  async (ctx, data: CreateBookingRequest) => {
    bookingErrorAtom(ctx, null);
    
    const response = await api.createBooking(data);
    
    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.message || 'Failed to create booking';
      bookingErrorAtom(ctx, errorMessage);
      throw new Error(errorMessage);
    }
    
    const booking = await response.json();
    currentBookingAtom(ctx, booking);
    return booking;
  },
  'createBooking'
);

// Async action to cancel a booking
export const cancelBooking = reatomAsync(
  async (ctx, id: string, reason?: string) => {
    const response = await api.cancelBooking(id, reason);
    if (!response.ok) {
      throw new Error('Failed to cancel booking');
    }
    const booking = await response.json();
    currentBookingAtom(ctx, booking);
    return booking;
  },
  'cancelBooking'
);

// Action to clear current booking
export const clearCurrentBooking = (ctx: any) => {
  currentBookingAtom(ctx, null);
  bookingErrorAtom(ctx, null);
};
