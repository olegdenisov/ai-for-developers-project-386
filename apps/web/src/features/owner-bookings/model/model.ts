import { action, atom, computed, withAsync, withAsyncData, wrap } from '@reatom/core';
import { apiClient, ownerApiClient } from '@shared/api';
import type { Booking } from '@entities/booking';

// ============================================
// ВКЛАДКИ БРОНИРОВАНИЙ
// ============================================

export type BookingsTab = 'upcoming' | 'past';

/** Текущая активная вкладка (upcoming — предстоящие, past — прошедшие) */
export const bookingsTab = atom<BookingsTab>('upcoming', 'bookings.tab');

// ============================================
// СПИСКИ БРОНИРОВАНИЙ
// ============================================

/** Сегодняшняя дата в формате YYYY-MM-DD */
const todayISO = () => new Date().toISOString().split('T')[0];

/** Вчерашняя дата в формате YYYY-MM-DD */
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

/**
 * Предстоящие бронирования (startDate = сегодня).
 * Вызов .retry() обновляет список.
 */
export const upcomingBookings = computed(async () => {
  const response = await wrap(
    ownerApiClient.getUpcomingBookings({ startDate: todayISO() }),
  );
  return response.data as Booking[];
}, 'bookings.upcoming').extend(withAsyncData({ initState: [] as Booking[] }));

/**
 * Прошедшие бронирования (endDate = вчера).
 * Вызов .retry() обновляет список.
 */
export const pastBookings = computed(async () => {
  const response = await wrap(
    ownerApiClient.getUpcomingBookings({ endDate: yesterdayISO() }),
  );
  return response.data as Booking[];
}, 'bookings.past').extend(withAsyncData({ initState: [] as Booking[] }));

// ============================================
// ДЕЙСТВИЯ
// ============================================

/**
 * Отменить бронирование через публичный endpoint.
 * onSuccess вызывается после успешной отмены для обновления списка.
 */
export const cancelAdminBooking = action(async (id: string, onSuccess: () => void) => {
  const response = await wrap(apiClient.cancelBooking(id));
  if (response.status >= 400) {
    throw new Error('Не удалось отменить бронирование');
  }
  onSuccess();
}, 'bookings.cancel').extend(withAsync());
