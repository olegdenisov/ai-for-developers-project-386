import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import {
  bookingFormAtom,
  formErrorsAtom,
  updateFormField,
  setFormErrors,
  clearForm,
} from './model';

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

describe('features/create-booking/model', () => {
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

});
