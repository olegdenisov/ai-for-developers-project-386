import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import {
  currentBookingAtom,
  bookingErrorAtom,
  isBookingSuccessAtom,
  fetchBooking,
  createBooking,
  cancelBooking,
  clearCurrentBooking,
  isFetchingBooking,
  isCreatingBooking,
  isCancellingBooking,
} from './model';
import type { Booking, CreateBookingRequest } from './types';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    getBooking: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

import { apiClient } from '@shared/api';

describe('entities/booking/model', () => {
  const mockEventType: EventType = {
    id: 'event-1',
    name: 'Встреча 30 мин',
    description: 'Короткая встреча',
    durationMinutes: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockSlot: Slot = {
    id: 'slot-1',
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T10:30:00Z',
    isAvailable: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockBooking: Booking = {
    id: 'booking-1',
    eventTypeId: 'event-1',
    slotId: 'slot-1',
    guestName: 'Иван Иванов',
    guestEmail: 'ivan@example.com',
    guestNotes: 'Тестовая заметка',
    status: 'confirmed',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    eventType: mockEventType,
    slot: mockSlot,
  };

  beforeEach(() => {
    context.reset();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('currentBookingAtom должен иметь начальное значение - null', () => {
      expect(peek(currentBookingAtom)).toBeNull();
    });

    it('bookingErrorAtom должен иметь начальное значение - null', () => {
      expect(peek(bookingErrorAtom)).toBeNull();
    });

    it('isBookingSuccessAtom должен иметь начальное значение - false', () => {
      expect(peek(isBookingSuccessAtom)).toBe(false);
    });

    it('currentBookingAtom должен обновляться при установке значения', () => {
      currentBookingAtom.set(mockBooking);
      expect(peek(currentBookingAtom)).toEqual(mockBooking);
    });

    it('bookingErrorAtom должен обновляться при установке значения', () => {
      bookingErrorAtom.set('Ошибка бронирования');
      expect(peek(bookingErrorAtom)).toBe('Ошибка бронирования');
    });

    it('isBookingSuccessAtom должен обновляться при установке значения', () => {
      isBookingSuccessAtom.set(true);
      expect(peek(isBookingSuccessAtom)).toBe(true);
    });
  });

  describe('fetchBooking', () => {
    it('должен загружать бронирование по ID', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      const result = await fetchBooking('booking-1');

      expect(apiClient.getBooking).toHaveBeenCalledWith('booking-1');
      expect(result).toEqual(mockBooking);
      expect(peek(currentBookingAtom)).toEqual(mockBooking);
    });

    it('должен обрабатывать ошибку 404', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(fetchBooking('nonexistent')).rejects.toThrow('Failed to fetch booking');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(fetchBooking('booking-1')).rejects.toThrow('Failed to fetch booking');
    });
  });

  describe('createBooking', () => {
    const createRequest: CreateBookingRequest = {
      eventTypeId: 'event-1',
      slotId: 'slot-1',
      guestName: 'Иван Иванов',
      guestEmail: 'ivan@example.com',
      guestNotes: 'Тестовая заметка',
    };

    beforeEach(() => {
      // Устанавливаем начальные ошибочные состояния
      bookingErrorAtom.set('Старая ошибка');
      isBookingSuccessAtom.set(false);
    });

    it('должен сбросить ошибку и установить флаг успеха после создания', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      await createBooking(createRequest);

      expect(peek(bookingErrorAtom)).toBeNull();
      expect(peek(isBookingSuccessAtom)).toBe(true);
    });

    it('должен создавать бронирование успешно', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      const result = await createBooking(createRequest);

      expect(apiClient.createBooking).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockBooking);
      expect(peek(currentBookingAtom)).toEqual(mockBooking);
      expect(peek(isBookingSuccessAtom)).toBe(true);
    });

    it('должен обрабатывать ошибку конфликта слота (409)', async () => {
      const conflictError = {
        status: 409,
        data: {
          message: 'Этот слот уже забронирован',
          code: 'SLOT_ALREADY_BOOKED',
        },
      };

      vi.mocked(apiClient.createBooking).mockResolvedValue(conflictError as unknown as Response);

      await expect(createBooking(createRequest)).rejects.toThrow('Этот слот уже забронирован');

      expect(peek(bookingErrorAtom)).toBe('Этот слот уже забронирован');
      expect(peek(isBookingSuccessAtom)).toBe(false);
    });

    it('должен обрабатывать ошибку валидации (400)', async () => {
      const validationError = {
        status: 400,
        data: {
          message: 'Некорректные данные',
        },
      };

      vi.mocked(apiClient.createBooking).mockResolvedValue(validationError as unknown as Response);

      await expect(createBooking(createRequest)).rejects.toThrow('Некорректные данные');

      expect(peek(bookingErrorAtom)).toBe('Некорректные данные');
    });

    it('должен использовать дефолтное сообщение об ошибке если нет message', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(createBooking(createRequest)).rejects.toThrow('Failed to create booking');

      expect(peek(bookingErrorAtom)).toBe('Failed to create booking');
    });
  });

  describe('cancelBooking', () => {
    const cancelledBooking: Booking = {
      ...mockBooking,
      status: 'cancelled',
    };

    it('должен отменять бронирование с причиной', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      } as unknown as Response);

      const result = await cancelBooking('booking-1', 'Не могу прийти');

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', 'Не могу прийти');
      expect(result).toEqual(cancelledBooking);
      expect(peek(currentBookingAtom)).toEqual(cancelledBooking);
    });

    it('должен отменять бронирование без причины', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      } as unknown as Response);

      const result = await cancelBooking('booking-1');

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', undefined);
      expect(result).toEqual(cancelledBooking);
    });

    it('должен обрабатывать ошибку отмены', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(cancelBooking('nonexistent')).rejects.toThrow('Failed to cancel booking');
    });
  });

  describe('clearCurrentBooking', () => {
    it('должен очищать все booking-related атомы', () => {
      // Устанавливаем значения
      currentBookingAtom.set(mockBooking);
      bookingErrorAtom.set('Ошибка');
      isBookingSuccessAtom.set(true);

      // Очищаем
      clearCurrentBooking();

      // Проверяем что всё очищено
      expect(peek(currentBookingAtom)).toBeNull();
      expect(peek(bookingErrorAtom)).toBeNull();
      expect(peek(isBookingSuccessAtom)).toBe(false);
    });

    it('должен работать корректно когда значения уже null/false', () => {
      clearCurrentBooking();

      expect(peek(currentBookingAtom)).toBeNull();
      expect(peek(bookingErrorAtom)).toBeNull();
      expect(peek(isBookingSuccessAtom)).toBe(false);
    });
  });

  describe('computed states', () => {
    describe('isFetchingBooking', () => {
      it('должен отслеживать состояние загрузки', async () => {
        vi.mocked(apiClient.getBooking).mockResolvedValue({
          status: 200,
          data: mockBooking,
        } as unknown as Response);

        expect(peek(isFetchingBooking)).toBe(false);

        const promise = fetchBooking('booking-1');
        expect(peek(isFetchingBooking)).toBe(true);

        await promise;
        expect(peek(isFetchingBooking)).toBe(false);
      });
    });

    describe('isCreatingBooking', () => {
      it('должен отслеживать состояние создания', async () => {
        vi.mocked(apiClient.createBooking).mockResolvedValue({
          status: 200,
          data: mockBooking,
        } as unknown as Response);

        expect(peek(isCreatingBooking)).toBe(false);

        const promise = createBooking({
          eventTypeId: 'event-1',
          slotId: 'slot-1',
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        });
        expect(peek(isCreatingBooking)).toBe(true);

        await promise;
        expect(peek(isCreatingBooking)).toBe(false);
      });
    });

    describe('isCancellingBooking', () => {
      it('должен отслеживать состояние отмены', async () => {
        vi.mocked(apiClient.cancelBooking).mockResolvedValue({
          status: 200,
          data: { ...mockBooking, status: 'cancelled' },
        } as unknown as Response);

        expect(peek(isCancellingBooking)).toBe(false);

        const promise = cancelBooking('booking-1');
        expect(peek(isCancellingBooking)).toBe(true);

        await promise;
        expect(peek(isCancellingBooking)).toBe(false);
      });
    });
  });
});
