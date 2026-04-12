import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import * as bookingController from './booking.controller.js';
import { bookingSchema, eventTypeSchema, slotSchema } from '../../common/schemas.js';

export async function bookingRoutes(app: FastifyInstance) {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.withTypeProvider<ZodTypeProvider>();

  // List public event types
  app.get('/event-types', {
    schema: {
      summary: 'List public event types',
      description: 'Returns all available event types for guests',
      response: {
        200: z.object({
          eventTypes: z.array(eventTypeSchema),
        }),
      },
    },
  }, bookingController.listPublicEventTypes);

  // Get single public event type
  app.get('/event-types/:id', {
    schema: {
      summary: 'Get public event type',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: eventTypeSchema,
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.getPublicEventType);

  // Get available slots for event type
  app.get('/event-types/:eventTypeId/slots', {
    schema: {
      summary: 'Get available slots for event type',
      description: 'Returns available slots that match event duration',
      params: z.object({
        eventTypeId: z.string(),
      }),
      querystring: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      response: {
        200: z.array(slotSchema),
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.getAvailableSlotsForEventType);

  // Create booking
  app.post('/bookings', {
    schema: {
      summary: 'Create booking',
      description: 'Create a new booking. Business rule: no double-booking at the same time.',
      body: z.object({
        eventTypeId: z.string(),
        slotId: z.string(),
        guestName: z.string().min(1).max(100),
        guestEmail: z.string().email(),
        guestNotes: z.string().max(1000).optional(),
      }),
      response: {
        201: bookingSchema,
        400: z.object({
          code: z.string(),
          message: z.string(),
          errors: z.array(z.object({
            field: z.string(),
            message: z.string(),
          })).optional(),
        }),
        409: z.object({
          code: z.string(),
          message: z.string(),
        }),
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.createBooking);

  // Get booking
  app.get('/bookings/:id', {
    schema: {
      summary: 'Get booking',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: bookingSchema,
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.getBooking);

  // Reschedule booking
  app.patch('/bookings/:id/reschedule', {
    schema: {
      summary: 'Reschedule booking',
      description: 'Move booking to a different slot of the same event type',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        newSlotId: z.string().uuid(),
      }),
      response: {
        200: bookingSchema,
        400: z.object({
          code: z.string(),
          message: z.string(),
          errors: z.array(z.object({
            field: z.string(),
            message: z.string(),
          })).optional(),
        }),
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
        409: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.rescheduleBooking);

  // Cancel booking
  app.post('/bookings/:id/cancel', {
    schema: {
      summary: 'Cancel booking',
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        reason: z.string().max(500).optional(),
      }).optional(),
      response: {
        200: bookingSchema,
        400: z.object({
          code: z.string(),
          message: z.string(),
        }),
        404: z.object({
          code: z.string(),
          message: z.string(),
        }),
      },
    },
  }, bookingController.cancelBooking);
}
