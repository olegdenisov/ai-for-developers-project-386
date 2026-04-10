import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import * as eventTypeController from './event-type.controller.js';
import { eventTypeSchema } from '../../common/schemas.js';

const createEventTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().min(1).max(480),
});

const updateEventTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().min(1).max(480).optional(),
});

export async function eventTypeRoutes(app: FastifyInstance) {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.withTypeProvider<ZodTypeProvider>();

  // List all event types
  app.get('/', {
    schema: {
      summary: 'List all event types',
      response: {
        200: z.array(eventTypeSchema),
      },
    },
  }, eventTypeController.listEventTypes);

  // Get single event type
  app.get('/:id', {
    schema: {
      summary: 'Get event type by ID',
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
  }, eventTypeController.getEventType);

  // Create event type
  app.post('/', {
    schema: {
      summary: 'Create new event type',
      body: createEventTypeSchema,
      response: {
        201: eventTypeSchema,
        400: z.object({
          code: z.string(),
          message: z.string(),
          errors: z.array(z.object({
            field: z.string(),
            message: z.string(),
          })).optional(),
        }),
      },
    },
  }, eventTypeController.createEventType);

  // Update event type
  app.put('/:id', {
    schema: {
      summary: 'Update event type',
      params: z.object({
        id: z.string(),
      }),
      body: updateEventTypeSchema,
      response: {
        200: eventTypeSchema,
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
  }, eventTypeController.updateEventType);

  // Delete event type
  app.delete('/:id', {
    schema: {
      summary: 'Delete event type',
      params: z.object({
        id: z.string(),
      }),
      response: {
        204: z.void(),
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
  }, eventTypeController.deleteEventType);
}
