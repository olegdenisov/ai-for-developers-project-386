import { wrap, atom, computed, withAsync, action } from '@reatom/core';
import type { Slot } from '@entities/slot';
import { apiClient } from '@shared/api';

// ============================================
// ATOMS
// ============================================

/**
 * Atom для хранения ID выбранного типа события
 * Синхронизирован с URL query-параметром ?eventTypeId=
 */
export const selectedEventTypeIdAtom = atom<string | null>(null, 'selectedEventTypeId');

/**
 * Atom для хранения текущего месяца календаря
 * Используется для навигации по месяцам в календаре
 */
export const currentCalendarMonthAtom = atom<Date>(new Date(), 'currentCalendarMonth');

/**
 * Atom для хранения выбранной даты
 * Синхронизирован с URL query-параметром ?date=
 */
export const selectedDateAtom = atom<Date | null>(null, 'selectedDate');

/**
 * Atom для хранения ID выбранного слота
 * Синхронизирован с URL query-параметром ?slotId=
 */
export const selectedSlotIdAtom = atom<string | null>(null, 'selectedSlotId');

/**
 * Atom для хранения выбранного слота (объект, не только ID)
 * Устанавливается при выборе слота или восстановлении из URL
 */
export const selectedSlotAtom = atom<Slot | null>(null, 'eventTypePage.selectedSlot');

/**
 * Atom для хранения загруженных слотов
 */
export const slotsAtom = atom<Slot[]>([], 'slotsAtom');

// ============================================
// SLOTS ACTIONS
// ============================================

/**
 * Action для загрузки слотов за период
 * Читает eventTypeId из selectedEventTypeIdAtom
 */
export const fetchSlotsForPeriod = action(async (startDate: Date, endDate: Date) => {
  const eventTypeId = selectedEventTypeIdAtom();

  if (!eventTypeId) {
    slotsAtom.set([]);
    return [];
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const response = await wrap(apiClient.getAvailableSlotsForEventType(
    eventTypeId,
    startDateStr,
    endDateStr
  ));

  if (response.status >= 400) {
    throw new Error('Failed to fetch available slots');
  }

  const slots = response.data;
  slotsAtom.set(slots);
  return slots;
}, 'fetchSlotsForPeriod').extend(withAsync());

/**
 * Action для загрузки слотов для текущего месяца календаря
 * Загружает слоты для всего видимого диапазона (6 недель ~ 42 дня)
 */
export const fetchSlotsForCalendar = action(async () => {
  const eventTypeId = selectedEventTypeIdAtom();

  if (!eventTypeId) {
    slotsAtom.set([]);
    return [];
  }

  const currentMonth = currentCalendarMonthAtom();

  // Вычисляем диапазон: начало первой недели месяца до конца последней недели
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  // Расширяем диапазон до полных недель (воскресенье до субботы)
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay());
  startOfCalendar.setHours(0, 0, 0, 0);

  const endOfCalendar = new Date(endOfMonth);
  endOfCalendar.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));
  endOfCalendar.setHours(23, 59, 59, 999);

  return fetchSlotsForPeriod(startOfCalendar, endOfCalendar);
}, 'fetchSlotsForCalendar').extend(withAsync());

/**
 * Action для загрузки доступных слотов на выбранную дату
 */
export const fetchSlotsForDate = action(async () => {
  const selectedDate = selectedDateAtom();
  if (!selectedDate) {
    slotsAtom.set([]);
    return [];
  }

  // Вычисляем диапазон дат (начало недели до конца недели)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return fetchSlotsForPeriod(startOfWeek, endOfWeek);
}, 'fetchSlotsForDate').extend(withAsync());

/**
 * Computed для отслеживания состояния загрузки слотов
 */
export const isSlotsLoading = computed(() => {
  return fetchSlotsForDate.pending();
}, 'isSlotsLoading');

// ============================================
// EXPORTS (для обратной совместимости)
// ============================================

// selectedDateForRoute -> selectedDateAtom (псевдоним для плавной миграции)
export { selectedDateAtom as selectedDateForRoute };
