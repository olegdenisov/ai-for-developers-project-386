import { atom } from '@reatom/core';
import { reatomAsync } from '@reatom/async';
import { fetchAvailableSlots } from '@entities/slot';

// Current view date atom (for calendar navigation)
export const calendarViewDateAtom = atom<Date>(new Date(), 'calendarViewDate');

// Selected date atom
export const selectedDateAtom = atom<Date | null>(null, 'selectedDate');

// Calendar loading state
export const calendarLoadingAtom = atom(false, 'calendarLoading');

// Action to select a date and fetch slots
export const selectDate = reatomAsync(
  async (ctx, date: Date, eventTypeId: string) => {
    selectedDateAtom(ctx, date);
    calendarLoadingAtom(ctx, true);

    try {
      // Calculate date range (start of week to end of week)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      await fetchAvailableSlots(ctx, {
        eventTypeId,
        startDate,
        endDate,
      });
    } finally {
      calendarLoadingAtom(ctx, false);
    }
  },
  'selectDate'
);

// Action to change calendar month/view
export const changeCalendarView = (ctx: any, date: Date) => {
  calendarViewDateAtom(ctx, date);
};
