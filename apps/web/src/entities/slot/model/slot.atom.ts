import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { Slot } from './slot.types';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Atom to store available slots for a date range
export const availableSlotsAtom = atom<Slot[]>([], 'availableSlots');

// Atom to store the currently selected slot
export const selectedSlotAtom = atom<Slot | null>(null, 'selectedSlot');

// Atom for the current date range
export const slotsDateRangeAtom = atom<{ startDate: string; endDate: string } | null>(
  null,
  'slotsDateRange'
);

// Async action to fetch available slots for an event type
export const fetchAvailableSlots = action(async (params: { 
  eventTypeId: string; 
  startDate: string; 
  endDate: string;
}) => {
  slotsDateRangeAtom.set({ startDate: params.startDate, endDate: params.endDate });
  
  const response = await wrap(api.getAvailableSlotsForEventType(
    params.eventTypeId,
    params.startDate,
    params.endDate
  ));
  
  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }
  
  const slots = await wrap(response.json());
  availableSlotsAtom.set(slots);
  return slots;
}, 'fetchAvailableSlots').extend(withAsync());

// Action to select a slot
export const selectSlot = action((slot: Slot) => {
  selectedSlotAtom.set(slot);
}, 'selectSlot');

// Action to clear selected slot
export const clearSelectedSlot = action(() => {
  selectedSlotAtom.set(null);
}, 'clearSelectedSlot');

// Computed: check if fetching slots
export const isFetchingSlots = computed(() => {
  return fetchAvailableSlots.pending();
}, 'isFetchingSlots');
