import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { apiClient } from '@shared/api';
import { Booking, CreateBookingRequest } from './types';

// Atom to store the current booking
export const currentBookingAtom = atom<Booking | null>(null, 'currentBooking');

// Atom to store booking creation error
export const bookingErrorAtom = atom<string | null>(null, 'bookingError');

// Atom to track booking success state
export const isBookingSuccessAtom = atom<boolean>(false, 'isBookingSuccess');

// Async action to fetch a booking by ID
export const fetchBooking = action(async (id: string) => {
  const response = await wrap(apiClient.getBooking(id));
  if (response.status >= 400) {
    throw new Error('Failed to fetch booking');
  }
  const booking = response.data;
  currentBookingAtom.set(booking);
  return booking;
}, 'fetchBooking').extend(withAsync());

// Async action to create a booking
export const createBooking = action(async (data: CreateBookingRequest) => {
  bookingErrorAtom.set(null);
  isBookingSuccessAtom.set(false);

  const response = await wrap(apiClient.createBooking(data));

  if (response.status >= 400) {
    const error = response.data as { message?: string };
    const errorMessage = error.message || 'Failed to create booking';
    bookingErrorAtom.set(errorMessage);
    throw new Error(errorMessage);
  }

  const booking = response.data;
  currentBookingAtom.set(booking);
  isBookingSuccessAtom.set(true);
  return booking;
}, 'createBooking').extend(withAsync());

// Async action to cancel a booking
export const cancelBooking = action(async (id: string, reason?: string) => {
  const response = await wrap(apiClient.cancelBooking(id, reason));
  if (response.status >= 400) {
    throw new Error('Failed to cancel booking');
  }
  const booking = response.data;
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
  return fetchBooking.pending() > 0;
}, 'isFetchingBooking');

export const isCreatingBooking = computed(() => {
  return createBooking.pending() > 0;
}, 'isCreatingBooking');

export const isCancellingBooking = computed(() => {
  return cancelBooking.pending() > 0;
}, 'isCancellingBooking');
