import { describe, it, expect } from 'vitest';
import { bookingFormSchema, validateBookingForm, type BookingFormData } from './validation';

describe('features/create-booking/validation', () => {
  describe('bookingFormSchema', () => {
    describe('guestName', () => {
      it('должен принимать валидное имя (1-100 символов)', () => {
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван Иванов',
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(true);
      });

      it('должен отклонять пустое имя', () => {
        const result = bookingFormSchema.safeParse({
          guestName: '',
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Имя обязательно');
        }
      });

      it('должен отклонять имя длиннее 100 символов', () => {
        const longName = 'a'.repeat(101);
        const result = bookingFormSchema.safeParse({
          guestName: longName,
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Имя не должно превышать 100 символов');
        }
      });

      it('должен принимать имя ровно 100 символов', () => {
        const name100 = 'a'.repeat(100);
        const result = bookingFormSchema.safeParse({
          guestName: name100,
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(true);
      });

      it('должен принимать имя из 1 символа', () => {
        const result = bookingFormSchema.safeParse({
          guestName: 'И',
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('guestEmail', () => {
      it('должен принимать валидный email', () => {
        const validEmails = [
          'ivan@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.com',
          '123@example.com',
        ];

        validEmails.forEach((email) => {
          const result = bookingFormSchema.safeParse({
            guestName: 'Иван',
            guestEmail: email,
          });
          expect(result.success).toBe(true);
        });
      });

      it('должен отклонять невалидный email', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'ivan@',
          'ivan@.com',
          '',
          'ivan@com',
        ];

        invalidEmails.forEach((email) => {
          const result = bookingFormSchema.safeParse({
            guestName: 'Иван',
            guestEmail: email,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe('Введите корректный email');
          }
        });
      });
    });

    describe('guestNotes', () => {
      it('должен принимать валидные заметки (до 1000 символов)', () => {
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
          guestNotes: 'Дополнительная информация для встречи',
        });
        expect(result.success).toBe(true);
      });

      it('должен принимать отсутствие заметок (optional)', () => {
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
        });
        expect(result.success).toBe(true);
      });

      it('должен принимать пустые заметки', () => {
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
          guestNotes: '',
        });
        expect(result.success).toBe(true);
      });

      it('должен отклонять заметки длиннее 1000 символов', () => {
        const longNotes = 'a'.repeat(1001);
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
          guestNotes: longNotes,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Заметки не должны превышать 1000 символов');
        }
      });

      it('должен принимать заметки ровно 1000 символов', () => {
        const notes1000 = 'a'.repeat(1000);
        const result = bookingFormSchema.safeParse({
          guestName: 'Иван',
          guestEmail: 'ivan@example.com',
          guestNotes: notes1000,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateBookingForm', () => {
    it('должен возвращать success=true для валидных данных', () => {
      const data: Partial<BookingFormData> = {
        guestName: 'Иван Иванов',
        guestEmail: 'ivan@example.com',
        guestNotes: 'Заметка',
      };

      const result = validateBookingForm(data);
      expect(result.success).toBe(true);
    });

    it('должен возвращать success=false для невалидных данных', () => {
      const data = {
        guestName: '',
        guestEmail: 'invalid-email',
      };

      const result = validateBookingForm(data);
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибки для невалидных данных', () => {
      const data = {
        guestName: '',
        guestEmail: 'invalid',
        guestNotes: 'a'.repeat(1001),
      };

      const result = validateBookingForm(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errors = result.error.issues;
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.path[0] === 'guestName')).toBe(true);
        expect(errors.some((e) => e.path[0] === 'guestEmail')).toBe(true);
        expect(errors.some((e) => e.path[0] === 'guestNotes')).toBe(true);
      }
    });

    it('должен возвращать распарсенные данные при успехе', () => {
      const data: Partial<BookingFormData> = {
        guestName: 'Иван',
        guestEmail: 'ivan@example.com',
        guestNotes: 'Тест',
      };

      const result = validateBookingForm(data);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.guestName).toBe('Иван');
        expect(result.data.guestEmail).toBe('ivan@example.com');
        expect(result.data.guestNotes).toBe('Тест');
      }
    });
  });
});
