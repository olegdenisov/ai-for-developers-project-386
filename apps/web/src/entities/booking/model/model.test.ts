import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
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
  let ctx: ReturnType<typeof createTestCtx>;

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
    status: 'CONFIRMED',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    eventType: mockEventType,
    slot: mockSlot,
  };

  beforeEach(() => {
    ctx = createTestCtx();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('currentBookingAtom должен иметь начальное значение - null', () => {
      expect(ctx.get(currentBookingAtom)).toBeNull();
    });

    it('bookingErrorAtom должен иметь начальное значение - null', () => {
      expect(ctx.get(bookingErrorAtom)).toBeNull();
    });

    it('isBookingSuccessAtom должен иметь начальное значение - false', () => {
      expect(ctx.get(isBookingSuccessAtom)).toBe(false);
    });

    it('currentBookingAtom должен обновляться при установке значения', () => {
      currentBookingAtom(ctx, mockBooking);
      expect(ctx.get(currentBookingAtom)).toEqual(mockBooking);
    });

    it('bookingErrorAtom должен обновляться при установке значения', () => {
      bookingErrorAtom(ctx, 'Ошибка бронирования');
      expect(ctx.get(bookingErrorAtom)).toBe('Ошибка бронирования');
    });

    it('isBookingSuccessAtom должен обновляться при установке значения', () => {
      isBookingSuccessAtom(ctx, true);
      expect(ctx.get(isBookingSuccessAtom)).toBe(true);
    });
  });

  describe('fetchBooking', () => {
    it('должен загружать бронирование по ID', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      const result = await fetchBooking(ctx, 'booking-1');

      expect(apiClient.getBooking).toHaveBeenCalledWith('booking-1');
      expect(result).toEqual(mockBooking);
      expect(ctx.get(currentBookingAtom)).toEqual(mockBooking);
    });

    it('должен обрабатывать ошибку 404', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(fetchBooking(ctx, 'nonexistent')).rejects.toThrow('Failed to fetch booking');
    });

    it('должен обрабатывать ошибку сервера', async () => {
      vi.mocked(apiClient.getBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(fetchBooking(ctx, 'booking-1')).rejects.toThrow('Failed to fetch booking');
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
      bookingErrorAtom(ctx, 'Старая ошибка');
      isBookingSuccessAtom(ctx, false);
    });

    it('должен сбрасывать ошибку и флаг успеха перед созданием', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      await createBooking(ctx, createRequest);

      expect(ctx.get(bookingErrorAtom)).toBeNull();
      expect(ctx.get(isBookingSuccessAtom)).toBe(false);
    });

    it('должен создавать бронирование успешно', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      const result = await createBooking(ctx, createRequest);

      expect(apiClient.createBooking).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockBooking);
      expect(ctx.get(currentBookingAtom)).toEqual(mockBooking);
      expect(ctx.get(isBookingSuccessAtom)).toBe(true);
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

      await expect(createBooking(ctx, createRequest)).rejects.toThrow('Этот слот уже забронирован');

      expect(ctx.get(bookingErrorAtom)).toBe('Этот слот уже забронирован');
      expect(ctx.get(isBookingSuccessAtom)).toBe(false);
    });

    it('должен обрабатывать ошибку валидации (400)', async () => {
      const validationError = {
        status: 400,
        data: {
          message: 'Некорректные данные',
        },
      };

      vi.mocked(apiClient.createBooking).mockResolvedValue(validationError as unknown as Response);

      await expect(createBooking(ctx, createRequest)).rejects.toThrow('Некорректные данные');

      expect(ctx.get(bookingErrorAtom)).toBe('Некорректные данные');
    });

    it('должен использовать дефолтное сообщение об ошибке если нет message', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(createBooking(ctx, createRequest)).rejects.toThrow('Failed to create booking');

      expect(ctx.get(bookingErrorAtom)).toBe('Failed to create booking');
    });
  });

  describe('cancelBooking', () => {
    const cancelledBooking: Booking = {
      ...mockBooking,
      status: 'CANCELLED',
    };

    it('должен отменять бронирование с причиной', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      } as unknown as Response);

      const result = await cancelBooking(ctx, 'booking-1', 'Не могу прийти');

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', 'Не могу прийти');
      expect(result).toEqual(cancelledBooking);
      expect(ctx.get(currentBookingAtom)).toEqual(cancelledBooking);
    });

    it('должен отменять бронирование без причины', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 200,
        data: cancelledBooking,
      } as unknown as Response);

      const result = await cancelBooking(ctx, 'booking-1');

      expect(apiClient.cancelBooking).toHaveBeenCalledWith('booking-1', undefined);
      expect(result).toEqual(cancelledBooking);
    });

    it('должен обрабатывать ошибку отмены', async () => {
      vi.mocked(apiClient.cancelBooking).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(cancelBooking(ctx, 'nonexistent')).rejects.toThrow('Failed to cancel booking');
    });
  });

  describe('clearCurrentBooking', () => {
    it('должен очищать все booking-related атомы', () => {
      // Устанавливаем значения
      currentBookingAtom(ctx, mockBooking);
      bookingErrorAtom(ctx, 'Ошибка');
      isBookingSuccessAtom(ctx, true);

      // Очищаем
      clearCurrentBooking(ctx);

      // Проверяем что всё очищено
      expect(ctx.get(currentBookingAtom)).toBeNull();
      expect(ctx.get(bookingErrorAtom)).toBeNull();
      expect(ctx.get(isBookingSuccessAtom)).toBe(false);
    });

    it('должен работать корректно когда значения уже null/false', () => {
      clearCurrentBooking(ctx);

      expect(ctx.get(currentBookingAtom)).toBeNull();
      expect(ctx.get(bookingErrorAtom)).toBeNull();
      expect(ctx.get(isBookingSuccessAtom)).toBe(false);
    });
  });

  describe('computed states', () => {
    describe('isFetchingBooking', () => {
      it('должен отслеживать состояние загрузки', async () => {
        vi.mocked(apiClient.getBooking).mockResolvedValue({
          status: 200,
          data: mockBooking,
        } as unknown as Response);

        expect(ctx.get(isFetchingBooking)).toBe(false);

        const promise = fetchBooking(ctx, 'booking-1');
        expect(ctx.get(isFetchingBooking)).toBe(true);

        await promise;
        expect(ctx.get(isFetchingBooking)).toBe(false);
      });
    });

    describe('isCreatingBooking', () => {
      it('должен отслеживать состояние создания', async () => {
        vi.mocked(apiClient.createBooking).mockResolvedValue({
          status: 200,
          data: mockBooking,
        } as unknown as Response);

        expect(ctx.get(isCreatingBooking)).toBe(false);

        const promise = createBooking(ctx, {
          eventTypeId: 'event-1',
          slotId: 'slot-1',
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        });
        expect(ctx.get(isCreatingBooking)).toBe(true);

        await promise;
        expect(ctx.get(isCreatingBooking)).toBe(false);
      });
    });

    describe('isCancellingBooking', () => {
      it('должен отслеживать состояние отмены', async () => {
        vi.mocked(apiClient.cancelBooking).mockResolvedValue({
          status: 200,
          data: { ...mockBooking, status: 'CANCELLED' },
        } as unknown as Response);

        expect(ctx.get(isCancellingBooking)).toBe(false);

        const promise = cancelBooking(ctx, 'booking-1');
        expect(ctx.get(isCancellingBooking)).toBe(true);

        await promise;
        expect(ctx.get(isCancellingBooking)).toBe(false);
      });
    });
  });
});
