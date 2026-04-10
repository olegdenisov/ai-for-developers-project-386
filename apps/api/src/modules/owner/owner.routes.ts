import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import * as ownerController from './owner.controller.js';

export async function ownerRoutes(app: FastifyInstance) {
  // Set up Zod type provider
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.withTypeProvider<ZodTypeProvider>();

  // Get owner profile
  app.get('/profile', {
    schema: {
      summary: 'Get owner profile',
      description: 'Returns the predefined calendar owner',
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          isPredefined: z.boolean(),
          createdAt: z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v)),
        }),
      },
    },
  }, ownerController.getProfile);

  // Get upcoming bookings
  app.get('/bookings', {
    schema: {
      summary: 'Get upcoming bookings',
      description: 'Returns all bookings with optional filtering',
      querystring: z.object({
        status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(20),
      }),
      response: {
        200: z.array(z.object({
          id: z.string(),
          eventTypeId: z.string(),
          slotId: z.string(),
          guestName: z.string(),
          guestEmail: z.string(),
          guestNotes: z.string().nullable(),
          status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
          createdAt: z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v)),
          updatedAt: z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v)),
          eventType: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            durationMinutes: z.number(),
          }),
          slot: z.object({
            id: z.string(),
            startTime: z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v)),
            endTime: z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v)),
            isAvailable: z.boolean(),
          }),
        })),
      },
    },
  }, ownerController.getUpcomingBookings);
}
