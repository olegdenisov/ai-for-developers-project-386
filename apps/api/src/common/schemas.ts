import { z } from 'zod';

// Конвертация Date-объекта в ISO-строку при сериализации ответа
const dateToIso = (val: unknown): unknown =>
  val instanceof Date ? val.toISOString() : val;

export const eventTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  createdAt: z.preprocess(dateToIso, z.string()),
  updatedAt: z.preprocess(dateToIso, z.string()),
});

export const slotSchema = z.object({
  id: z.string(),
  startTime: z.preprocess(dateToIso, z.string()),
  endTime: z.preprocess(dateToIso, z.string()),
  isAvailable: z.boolean(),
  createdAt: z.preprocess(dateToIso, z.string()),
});

export const bookingSchema = z.object({
  id: z.string(),
  eventTypeId: z.string(),
  slotId: z.string(),
  guestName: z.string(),
  guestEmail: z.string(),
  guestNotes: z.string().nullable(),
  status: z
    .enum(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .transform((s) => s.toLowerCase() as 'confirmed' | 'cancelled' | 'completed'),
  createdAt: z.preprocess(dateToIso, z.string()),
  updatedAt: z.preprocess(dateToIso, z.string()),
  eventType: eventTypeSchema,
  slot: slotSchema,
});
