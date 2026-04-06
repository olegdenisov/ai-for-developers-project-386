import { atom } from '@reatom/core';
import { reatomAsync } from '@reatom/async';
import { PublicApi } from '@calendar-booking/api-client';
import { Slot, SlotWithBooking } from './slot.types';

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
export const fetchAvailableSlots = reatomAsync(
  async (ctx, params: { eventTypeId: string; startDate: string; endDate: string }) => {
    slotsDateRangeAtom(ctx, { startDate: params.startDate, endDate: params.endDate });
    
    const response = await api.getAvailableSlotsForEventType(
      params.eventTypeId,
      params.startDate,
      params.endDate
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch available slots');
    }
    
    const slots = await response.json();
    availableSlotsAtom(ctx, slots);
    return slots;
  },
  'fetchAvailableSlots'
);

// Async action to fetch a single slot by ID
export const fetchSlotById = reatomAsync(
  async (ctx, id: string) => {
    // Note: This endpoint doesn't exist in the public API, 
    // we'll need to find the slot from available slots
    const slots = availableSlotsAtom(ctx);
    const slot = slots.find((s) => s.id === id);
    if (slot) {
      selectedSlotAtom(ctx, slot);
    }
    return slot;
  },
  'fetchSlotById'
);

// Action to select a slot
export const selectSlot = (ctx: any, slot: Slot) => {
  selectedSlotAtom(ctx, slot);
};

// Action to clear selected slot
export const clearSelectedSlot = (ctx: any) => {
  selectedSlotAtom(ctx, null);
};
