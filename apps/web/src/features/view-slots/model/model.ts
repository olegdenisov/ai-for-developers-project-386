import { atom, action, computed } from '@reatom/core';
import { fetchAvailableSlots } from '@entities/slot';

// Current view date atom (for calendar navigation)
export const calendarViewDateAtom = atom<Date>(new Date(), 'calendarViewDate');

// Selected date atom
export const selectedDateAtom = atom<Date | null>(null, 'selectedDate');

// Action to select a date and fetch slots
export const selectDate = action(async (date: Date, eventTypeId: string) => {
  selectedDateAtom.set(date);

  // Calculate date range (start of week to end of week)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  await fetchAvailableSlots({
    eventTypeId,
    startDate,
    endDate,
  });
}, 'selectDate');

// Action to change calendar month/view
export const changeCalendarView = action((date: Date) => {
  calendarViewDateAtom.set(date);
}, 'changeCalendarView');

// Computed: check if calendar is loading
export const calendarLoadingAtom = computed(() => {
  return fetchAvailableSlots.pending() > 0;
}, 'calendarLoadingAtom');
