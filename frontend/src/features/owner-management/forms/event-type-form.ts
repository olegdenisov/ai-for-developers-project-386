import { reatomForm, wrap } from '@reatom/core';
import { z } from 'zod';

export const eventTypeForm = reatomForm(
  {
    name: '',
    durationMinutes: 30,
  },
  {
    name: 'eventTypeForm',
    validateOnBlur: true,
    schema: z.object({
      name: z.string().min(1, 'Название обязательно').max(100, 'Слишком длинное название'),
      durationMinutes: z.number().min(1, 'Минимум 1 минута').max(480, 'Максимум 480 минут'),
    }),
    onSubmit: async (values, { method, id }) => {
      const url = id ? `/api/event-types/${id}` : '/api/event-types';
      const response = await wrap(
        fetch(url, {
          method: method || (id ? 'PUT' : 'POST'),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }),
      );
      if (!response.ok) {
        throw new Error('Ошибка при сохранении типа события');
      }
      return await wrap(response.json());
    },
  },
);