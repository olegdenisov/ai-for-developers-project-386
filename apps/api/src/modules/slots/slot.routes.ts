import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import * as slotController from './slot.controller.js';

const slotSchema = z.object({
  id: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isAvailable: z.boolean(),
  createdAt: z.string().datetime(),
});

export async function slotRoutes(app: FastifyInstance) {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.withTypeProvider<ZodTypeProvider>();

  // List available slots
  app.get('/', {
    schema: {
      summary: 'List available slots',
      description: 'Returns available time slots for booking',
      querystring: z.object({
        eventTypeId: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
      }),
      response: {
        200: z.array(slotSchema),
        400: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, slotController.listAvailableSlots);

  // Get single slot
  app.get('/:id', {
    schema: {
      summary: 'Get slot by ID',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          id: z.string(),
          startTime: z.string().datetime(),
          endTime: z.string().datetime(),
          isAvailable: z.boolean(),
          createdAt: z.string().datetime(),
          booking: z.object({
            id: z.string(),
            guestName: z.string(),
            guestEmail: z.string(),
            status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
            eventType: z.object({
              id: z.string(),
              name: z.string(),
            }),
          }).nullable(),
        }),
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, slotController.getSlot);
}
