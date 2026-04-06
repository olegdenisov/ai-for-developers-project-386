import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { Booking, CreateBookingRequest } from './booking.types';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Atom to store the current booking
export const currentBookingAtom = atom<Booking | null>(null, 'currentBooking');

// Atom to store booking creation error
export const bookingErrorAtom = atom<string | null>(null, 'bookingError');

// Atom to track booking success state
export const isBookingSuccessAtom = atom<boolean>(false, 'isBookingSuccess');

// Async action to fetch a booking by ID
export const fetchBooking = action(async (id: string) => {
  const response = await wrap(api.getBooking(id));
  if (!response.ok) {
    throw new Error('Failed to fetch booking');
  }
  const booking = await wrap(response.json());
  currentBookingAtom.set(booking);
  return booking;
}, 'fetchBooking').extend(withAsync());

// Async action to create a booking
export const createBooking = action(async (data: CreateBookingRequest) => {
  bookingErrorAtom.set(null);
  isBookingSuccessAtom.set(false);
  
  const response = await wrap(api.createBooking(data));
  
  if (!response.ok) {
    const error = await wrap(response.json());
    const errorMessage = error.message || 'Failed to create booking';
    bookingErrorAtom.set(errorMessage);
    throw new Error(errorMessage);
  }
  
  const booking = await wrap(response.json());
  currentBookingAtom.set(booking);
  isBookingSuccessAtom.set(true);
  return booking;
}, 'createBooking').extend(withAsync());

// Async action to cancel a booking
export const cancelBooking = action(async (id: string, reason?: string) => {
  const response = await wrap(api.cancelBooking(id, reason));
  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }
  const booking = await wrap(response.json());
  currentBookingAtom.set(booking);
  return booking;
}, 'cancelBooking').extend(withAsync());

// Action to clear current booking
export const clearCurrentBooking = action(() => {
  currentBookingAtom.set(null);
  bookingErrorAtom.set(null);
  isBookingSuccessAtom.set(false);
}, 'clearCurrentBooking');

// Computed: check if operations are pending
export const isFetchingBooking = computed(() => {
  return fetchBooking.pending();
}, 'isFetchingBooking');

export const isCreatingBooking = computed(() => {
  return createBooking.pending();
}, 'isCreatingBooking');

export const isCancellingBooking = computed(() => {
  return cancelBooking.pending();
}, 'isCancellingBooking');
