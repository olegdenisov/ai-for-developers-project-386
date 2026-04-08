import { z } from 'zod/v4';

export const bookingFormSchema = z.object({
  guestName: z.string()
    .min(1, 'Имя обязательно')
    .max(100, 'Имя не должно превышать 100 символов'),
  guestEmail: z.string()
    .email('Введите корректный email'),
  guestNotes: z.string()
    .max(1000, 'Заметки не должны превышать 1000 символов')
    .optional(),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const validateBookingForm = (data: unknown) => {
  return bookingFormSchema.safeParse(data);
};
