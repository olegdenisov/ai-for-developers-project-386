// Импорты
import { atom, action, computed } from '@reatom/core';
import { navigate } from '@app/router';
import { selectedDateForRoute, slotsAtom, currentCalendarMonthAtom } from './route';
import { bookingEventTypeAtom, bookingSlotAtom } from '@pages/book-catalog/route';
import type { Slot } from '@entities/slot';
import type { EventType } from '@entities/event-type';
import dayjs from 'dayjs';
import { getSlotsForDate } from '../helpers';

// ============================================
// ATOMS
// ============================================

// Атом для хранения выбранного слота
export const selectedSlotAtom = atom<Slot | null>(null, 'eventTypePage.selectedSlot');

// ============================================
// COMPUTED
// ============================================

// Computed для генерации дней календаря
export const calendarDaysAtom = computed(() => {
  const currentMonth = currentCalendarMonthAtom();
  
  const startOfMonth = dayjs(currentMonth).startOf('month');
  const endOfMonth = dayjs(currentMonth).endOf('month');
  const startOfCalendar = startOfMonth.startOf('week');
  const endOfCalendar = endOfMonth.endOf('week');

  const days: Date[] = [];
  let currentDay = startOfCalendar;

  while (currentDay.isBefore(endOfCalendar) || currentDay.isSame(endOfCalendar, 'day')) {
    days.push(currentDay.toDate());
    currentDay = currentDay.add(1, 'day');
  }

  return days;
}, 'calendarDaysAtom');

// Computed для получения слотов на выбранную дату
export const slotsForSelectedDateAtom = computed(() => {
  const selectedDate = selectedDateForRoute();
  const slots = slotsAtom();
  
  if (!selectedDate) return [];
  return getSlotsForDate(slots, selectedDate);
}, 'slotsForSelectedDateAtom');

// ============================================
// ACTIONS
// ============================================

// Навигация на предыдущий месяц
export const goToPrevMonth = action(() => {
  const currentMonth = currentCalendarMonthAtom();
  const newMonth = dayjs(currentMonth).subtract(1, 'month').toDate();
  currentCalendarMonthAtom.set(newMonth);
}, 'goToPrevMonth');

// Навигация на следующий месяц
export const goToNextMonth = action(() => {
  const currentMonth = currentCalendarMonthAtom();
  const newMonth = dayjs(currentMonth).add(1, 'month').toDate();
  currentCalendarMonthAtom.set(newMonth);
}, 'goToNextMonth');

// Выбор даты
export const selectDate = action((date: Date) => {
  selectedDateForRoute.set(date);
  // Сбрасываем выбранный слот при смене даты
  selectedSlotAtom.set(null);
}, 'selectDate');

// Выбор слота
export const selectSlot = action((slot: Slot) => {
  if (slot.isAvailable) {
    selectedSlotAtom.set(slot);
  }
}, 'selectSlot');

// Переход к бронированию
export const proceedToBooking = action((eventType: EventType | undefined) => {
  const selectedSlot = selectedSlotAtom();
  
  if (selectedSlot && eventType) {
    // Сохраняем данные в atoms контекста бронирования
    bookingEventTypeAtom.set(eventType);
    bookingSlotAtom.set(selectedSlot);
    // Переходим на страницу бронирования
    navigate.booking();
  }
}, 'proceedToBooking');

// Возврат на главную
export const goBack = action(() => {
  navigate.home();
}, 'goBack');
