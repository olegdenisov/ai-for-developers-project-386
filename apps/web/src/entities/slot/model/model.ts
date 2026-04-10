import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { apiClient } from '@shared/api';
import { Slot } from './types';

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

  const response = await wrap(apiClient.getAvailableSlotsForEventType(
    params.eventTypeId,
    params.startDate,
    params.endDate
  ));

  if (response.status >= 400) {
    throw new Error('Failed to fetch available slots');
  }

  const slots = response.data;
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
  return fetchAvailableSlots.pending() > 0;
}, 'isFetchingSlots');
