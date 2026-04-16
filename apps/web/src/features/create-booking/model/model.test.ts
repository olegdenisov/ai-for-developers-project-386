import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import {
  bookingFormAtom,
  formErrorsAtom,
  updateFormField,
  setFormErrors,
  clearForm,
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

describe('features/create-booking/model', () => {
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
    it('bookingFormAtom должен иметь начальное значение с пустыми полями', () => {
      expect(peek(bookingFormAtom)).toEqual({
        guestName: '',
        guestEmail: '',
        guestNotes: '',
      });
    });

    it('formErrorsAtom должен иметь начальное значение - пустой объект', () => {
      expect(peek(formErrorsAtom)).toEqual({});
    });

    it('bookingEventTypeAtom должен иметь начальное значение - null', () => {
      expect(peek(bookingEventTypeAtom)).toBeNull();
    });

    it('bookingSlotAtom должен иметь начальное значение - null', () => {
      expect(peek(bookingSlotAtom)).toBeNull();
    });
  });

  describe('updateFormField', () => {
    it('должен обновлять поле формы', () => {
      updateFormField('guestName', 'Иван');

      expect(peek(bookingFormAtom).guestName).toBe('Иван');
    });

    it('должен сохранять остальные поля при обновлении одного', () => {
      updateFormField('guestName', 'Иван');
      updateFormField('guestEmail', 'ivan@example.com');

      const form = peek(bookingFormAtom);
      expect(form.guestName).toBe('Иван');
      expect(form.guestEmail).toBe('ivan@example.com');
      expect(form.guestNotes).toBe('');
    });

    it('должен очищать ошибку для поля при его обновлении', () => {
      setFormErrors({ guestName: 'Имя обязательно' });
      expect(peek(formErrorsAtom).guestName).toBe('Имя обязательно');

      updateFormField('guestName', 'Иван');

      expect(peek(formErrorsAtom).guestName).toBeUndefined();
    });

    it('не должен очищать ошибки других полей', () => {
      setFormErrors({
        guestName: 'Имя обязательно',
        guestEmail: 'Email обязателен',
      });

      updateFormField('guestName', 'Иван');

      const errors = peek(formErrorsAtom);
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

      setFormErrors(errors);

      expect(peek(formErrorsAtom)).toEqual(errors);
    });
  });

  describe('clearForm', () => {
    it('должен очищать все поля формы', () => {
      updateFormField('guestName', 'Иван');
      updateFormField('guestEmail', 'ivan@example.com');
      updateFormField('guestNotes', 'Заметка');

      clearForm();

      expect(peek(bookingFormAtom)).toEqual({
        guestName: '',
        guestEmail: '',
        guestNotes: '',
      });
    });

    it('должен очищать ошибки формы', () => {
      setFormErrors({ guestName: 'Ошибка' });

      clearForm();

      expect(peek(formErrorsAtom)).toEqual({});
    });
  });

  describe('booking context atoms', () => {
    it('bookingEventTypeAtom должен сохранять тип события для бронирования', () => {
      bookingEventTypeAtom.set(mockEventType);

      expect(peek(bookingEventTypeAtom)).toEqual(mockEventType);
    });

    it('bookingSlotAtom должен сохранять слот для бронирования', () => {
      bookingSlotAtom.set(mockSlot);

      expect(peek(bookingSlotAtom)).toEqual(mockSlot);
    });
  });

  describe('submitBooking (shared context)', () => {
    beforeEach(() => {
      bookingEventTypeAtom.set(mockEventType);
      bookingSlotAtom.set(mockSlot);
    });

    it('должен выбрасывать ошибку если тип события не выбран', async () => {
      bookingEventTypeAtom.set(null);

      await expect(
        submitBooking({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Event type or slot not selected');
    });

    it('должен выбрасывать ошибку если слот не выбран', async () => {
      bookingSlotAtom.set(null);

      await expect(
        submitBooking({
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

      const result = await submitBooking(formData);

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

      await submitBooking({
        guestName: 'Иван',
        guestEmail: 'ivan@example.com',
      });

      expect(peek(bookingEventTypeAtom)).toBeNull();
      expect(peek(bookingSlotAtom)).toBeNull();
    });

    it('должен обрабатывать ошибку API', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 409,
        data: { message: 'Слот уже занят' },
      } as unknown as Response);

      await expect(
        submitBooking({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Слот уже занят');

      expect(peek(bookingEventTypeAtom)).toEqual(mockEventType);
      expect(peek(bookingSlotAtom)).toEqual(mockSlot);
    });

    it('должен использовать дефолтное сообщение если нет message', async () => {
      vi.mocked(apiClient.createBooking).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(
        submitBooking({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        })
      ).rejects.toThrow('Failed to create booking');
    });
  });
});
