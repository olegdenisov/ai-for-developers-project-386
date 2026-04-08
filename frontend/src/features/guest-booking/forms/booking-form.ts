import { reatomForm, reatomField, wrap } from '@reatom/core';
import { z } from 'zod';

export const bookingForm = reatomForm(
  {
    guestName: '',
    guestEmail: '',
    slotId: '',
  },
  {
    name: 'bookingForm',
    validateOnBlur: true,
    schema: z.object({
      guestName: z.string().min(1, 'Имя обязательно'),
      guestEmail: z.string().email('Некорректный email'),
      slotId: z.string().min(1, 'Выберите слот'),
    }),
    onSubmit: async (values) => {
      const response = await wrap(
        fetch('/api/public/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }),
      );
      if (!response.ok) {
        throw new Error('Ошибка при создании бронирования');
      }
      return await wrap(response.json());
    },
  },
);