// Импорты
import { action, computed } from '@reatom/core';
import {
  selectedDateAtom,
  selectedSlotIdAtom,
  selectedSlotAtom,
  selectedEventTypeIdAtom,
  slotsAtom,
  currentCalendarMonthAtom,
  updateUrlParam,
} from './route';
import { bookingEventTypeAtom, bookingSlotAtom } from '@features/create-booking';
import { navigate } from '@app/router';
import type { Slot } from '@entities/slot';
import type { EventType } from '@entities/event-type';
import dayjs from 'dayjs';
import { getSlotsForDate } from '../helpers';

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
  const selectedDate = selectedDateAtom();
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

// Выбор даты — обновляет атом и URL
export const selectDate = action((date: Date) => {
  selectedDateAtom.set(date);
  // Сбрасываем выбранный слот при смене даты
  selectedSlotAtom.set(null);
  selectedSlotIdAtom.set(null);
  // Синхронизируем с URL
  updateUrlParam('date', date.toISOString().split('T')[0]);
  updateUrlParam('slotId', null);
}, 'selectDate');

// Выбор слота — обновляет атом и URL
export const selectSlot = action((slot: Slot) => {
  if (slot.isAvailable) {
    selectedSlotAtom.set(slot);
    selectedSlotIdAtom.set(slot.id);
    updateUrlParam('slotId', slot.id);
  }
}, 'selectSlot');

// Переход к бронированию
export const proceedToBooking = action((eventType: EventType | undefined) => {
  const selectedSlot = selectedSlotAtom();

  if (selectedSlot && eventType) {
    // Сохраняем данные в atoms контекста бронирования
    bookingEventTypeAtom.set(eventType);
    bookingSlotAtom.set(selectedSlot);
    // Переходим на страницу подтверждения бронирования
    navigate.bookingConfirmation();
  }
}, 'proceedToBooking');

// Возврат на страницу каталога — очищает выбранный тип события и URL-параметры
export const goBack = action(() => {
  selectedEventTypeIdAtom.set(null);
  selectedDateAtom.set(null);
  selectedSlotAtom.set(null);
  selectedSlotIdAtom.set(null);
  updateUrlParam('eventTypeId', null);
  updateUrlParam('date', null);
  updateUrlParam('slotId', null);
}, 'goBack');
