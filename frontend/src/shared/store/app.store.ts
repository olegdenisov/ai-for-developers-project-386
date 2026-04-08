import { atom, action } from '@reatom/core';
import { apiClient } from '../api/client';
import { EventType } from '../../entities/event-type/types';
import { Booking } from '../../entities/booking/types';
import { Slot } from '../../entities/slot/types';

// Атомы для данных
export const eventTypesAtom = atom<EventType[]>([], 'eventTypesAtom');
export const bookingsAtom = atom<Booking[]>([], 'bookingsAtom');
export const slotsAtom = atom<Slot[]>([], 'slotsAtom');

// Атомы для UI состояния
export const isLoadingAtom = atom(false, 'isLoadingAtom');
export const selectedEventTypeIdAtom = atom<string | null>(null, 'selectedEventTypeIdAtom');
export const selectedSlotIdAtom = atom<string | null>(null, 'selectedSlotIdAtom');

// Действия загрузки типов событий (публичных)
export const fetchPublicEventTypes = action(async (ctx) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.get<EventType[]>('/public/event-types');
    eventTypesAtom(ctx, data);
  } catch (error) {
    console.error('Ошибка загрузки типов событий:', error);
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'fetchPublicEventTypes');

// Действия загрузки типов событий (для владельца)
export const fetchOwnerEventTypes = action(async (ctx) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.get<EventType[]>('/event-types');
    eventTypesAtom(ctx, data);
  } catch (error) {
    console.error('Ошибка загрузки типов событий владельца:', error);
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'fetchOwnerEventTypes');

// Действия загрузки слотов для типа события
export const fetchSlotsForEventType = action(async (ctx, eventTypeId: string, startDate: string, endDate: string) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.get<Slot[]>(`/public/event-types/${eventTypeId}/slots`, { startDate, endDate });
    slotsAtom(ctx, data);
  } catch (error) {
    console.error('Ошибка загрузки слотов:', error);
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'fetchSlotsForEventType');

// Действия загрузки бронирований владельца
export const fetchOwnerBookings = action(async (ctx) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.get<Booking[]>('/owner/bookings');
    bookingsAtom(ctx, data);
  } catch (error) {
    console.error('Ошибка загрузки бронирований:', error);
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'fetchOwnerBookings');

// Действие создания бронирования
export const createBooking = action(async (ctx, params: { slotId: string; guestName: string; guestEmail: string }) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.post('/public/bookings', params);
    // Можно обновить список слотов
    return data;
  } catch (error) {
    console.error('Ошибка создания бронирования:', error);
    throw error;
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'createBooking');

// Действие создания типа события
export const createEventType = action(async (ctx, params: { name: string; durationMinutes: number }) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.post('/event-types', params);
    // Обновляем список
    await fetchOwnerEventTypes(ctx);
    return data;
  } catch (error) {
    console.error('Ошибка создания типа события:', error);
    throw error;
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'createEventType');

// Действие обновления типа события
export const updateEventType = action(async (ctx, params: { id: string; name: string; durationMinutes: number }) => {
  isLoadingAtom(ctx, true);
  try {
    const data = await apiClient.put(`/event-types/${params.id}`, params);
    await fetchOwnerEventTypes(ctx);
    return data;
  } catch (error) {
    console.error('Ошибка обновления типа события:', error);
    throw error;
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'updateEventType');

// Действие удаления типа события
export const deleteEventType = action(async (ctx, id: string) => {
  isLoadingAtom(ctx, true);
  try {
    await apiClient.delete(`/event-types/${id}`);
    await fetchOwnerEventTypes(ctx);
  } catch (error) {
    console.error('Ошибка удаления типа события:', error);
    throw error;
  } finally {
    isLoadingAtom(ctx, false);
  }
}, 'deleteEventType');

// Действия навигации
export const setSelectedEventType = action((ctx, id: string | null) => {
  selectedEventTypeIdAtom(ctx, id);
}, 'setSelectedEventType');

export const setSelectedSlot = action((ctx, id: string | null) => {
  selectedSlotIdAtom(ctx, id);
}, 'setSelectedSlot');