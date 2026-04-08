import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
import {
  bookingFormAtom,
  formErrorsAtom,
  updateFormField,
  setFormErrors,
  clearForm,
  submitBookingForm,
  bookingEventTypeAtom,
  bookingSlotAtom,
  submitBooking,
} from './model';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';
import type { Booking } from '@entities/booking';

// Мок для API клиента и entities
vi.mock('@shared/api', () => ({
  apiClient: {
    createBooking: vi.fn(),
  },
}));

vi.mock('@entities/booking', () => ({
  createBooking: vi.fn(),
  currentBookingAtom: {
    set: vi.fn(),
  },
  bookingErrorAtom: {
    set: vi.fn(),
  },
  isBookingSuccessAtom: {
    set: vi.fn(),
  },
}));

import { apiClient } from '@shared/api';
import { createBooking as createBookingEntity } from '@entities/booking';

describe('features/create-booking/model', () => {
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
    it('bookingFormAtom должен иметь начальное значение с пустыми полями', () => {
      const value = ctx.get(bookingFormAtom);
      expect(value).toEqual({
        guestName: '',
        guestEmail: '',
        guestNotes: '',
      });
    });

    it('formErrorsAtom должен иметь начальное значение - пустой объект', () => {
      const value = ctx.get(formErrorsAtom);
      expect(value).toEqual({});
    });

    it('bookingEventTypeAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(bookingEventTypeAtom);
      expect(value).toBeNull();
    });

    it('bookingSlotAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(bookingSlotAtom);
      expect(value).toBeNull();
    });
  });

  describe('updateFormField', () => {
    it('должен обновлять поле формы', () => {
      updateFormField(ctx, 'guestName', 'Иван');

      expect(ctx.get(bookingFormAtom).guestName).toBe('Иван');
    });

    it('должен сохранять остальные поля при обновлении одного', () => {
      updateFormField(ctx, 'guestName', 'Иван');
      updateFormField(ctx, 'guestEmail', 'ivan@example.com');

      const form = ctx.get(bookingFormAtom);
      expect(form.guestName).toBe('Иван');
      expect(form.guestEmail).toBe('ivan@example.com');
      expect(form.guestNotes).toBe('');
    });

    it('должен очищать ошибку для поля при его обновлении', () => {
      // Устанавливаем ошибку
      setFormErrors(ctx, { guestName: 'Имя обязательно' });
      expect(ctx.get(formErrorsAtom).guestName).toBe('Имя обязательно');

      // Обновляем поле
      updateFormField(ctx, 'guestName', 'Иван');

      // Ошибка должна быть очищена
      expect(ctx.get(formErrorsAtom).guestName).toBeUndefined();
    });

    it('не должен очищать ошибки других полей', () => {
      setFormErrors(ctx, {
        guestName: 'Имя обязательно',
        guestEmail: 'Email обязателен',
      });

      updateFormField(ctx, 'guestName', 'Иван');

      const errors = ctx.get(formErrorsAtom);
      expect(errors.guestName).toBeUndefined();
      expect(errors.guestEmail).toBe('Email обязателен');
    });
  });

  describe('setFormErrors', () => {
    it('должен устанавливать ошибки формы', () => {
      const errors = {
        guestName: 'Имя обязательно',
        guestEmail: 'Введите корректный email',
      };

      setFormErrors(ctx, errors);

      expect(ctx.get(formErrorsAtom)).toEqual(errors);
    });
  });

  describe('clearForm', () => {
    it('должен очищать все поля формы', () => {
      // Заполняем форму
      updateFormField(ctx, 'guestName', 'Иван');
      updateFormField(ctx, 'guestEmail', 'ivan@example.com');
      updateFormField(ctx, 'guestNotes', 'Заметка');

      // Очищаем
      clearForm(ctx);

      expect(ctx.get(bookingFormAtom)).toEqual({
        guestName: '',
        guestEmail: '',
        guestNotes: '',
      });
    });

    it('должен очищать ошибки формы', () => {
      setFormErrors(ctx, { guestName: 'Ошибка' });

      clearForm(ctx);

      expect(ctx.get(formErrorsAtom)).toEqual({});
    });
  });

  describe('booking context atoms', () => {
    it('bookingEventTypeAtom должен сохранять тип события для бронирования', () => {
      bookingEventTypeAtom(ctx, mockEventType);

      expect(ctx.get(bookingEventTypeAtom)).toEqual(mockEventType);
    });

    it('bookingSlotAtom должен сохранять слот для бронирования', () => {
      bookingSlotAtom(ctx, mockSlot);

      expect(ctx.get(bookingSlotAtom)).toEqual(mockSlot);
    });
  });

  describe('submitBooking (shared context)', () => {
    beforeEach(() => {
      bookingEventTypeAtom(ctx, mockEventType);
      bookingSlotAtom(ctx, mockSlot);
    });

    it('должен выбрасывать ошибку если тип события не выбран', async () => {
      bookingEventTypeAtom(ctx, null);

      await expect(
        submitBooking(ctx, {
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Event type or slot not selected');
    });

    it('должен выбрасывать ошибку если слот не выбран', async () => {
      bookingSlotAtom(ctx, null);

      await expect(
        submitBooking(ctx, {
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Event type or slot not selected');
    });

    it('должен создавать бронирование с данными из контекста', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      const formData = {
        guestName: 'Иван Иванов',
        guestEmail: 'ivan@example.com',
        guestNotes: 'Тестовая заметка',
      };

      const result = await submitBooking(ctx, formData);

      expect(apiClient.createBooking).toHaveBeenCalledWith({
        eventTypeId: 'event-1',
        slotId: 'slot-1',
        guestName: 'Иван Иванов',
        guestEmail: 'ivan@example.com',
        guestNotes: 'Тестовая заметка',
      });

      expect(result).toEqual(mockBooking);
    });

    it('должен очищать контекст бронирования после успеха', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 200,
        data: mockBooking,
      } as unknown as Response);

      await submitBooking(ctx, {
        guestName: 'Иван',
        guestEmail: 'ivan@example.com',
      });

      expect(ctx.get(bookingEventTypeAtom)).toBeNull();
      expect(ctx.get(bookingSlotAtom)).toBeNull();
    });

    it('должен обрабатывать ошибку API', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 409,
        data: { message: 'Слот уже занят' },
      } as unknown as Response);

      await expect(
        submitBooking(ctx, {
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Слот уже занят');

      // Контекст не должен очищаться при ошибке
      expect(ctx.get(bookingEventTypeAtom)).toEqual(mockEventType);
      expect(ctx.get(bookingSlotAtom)).toEqual(mockSlot);
    });

    it('должен использовать дефолтное сообщение если нет message', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(
        submitBooking(ctx, {
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Failed to create booking');
    });
  });
});
