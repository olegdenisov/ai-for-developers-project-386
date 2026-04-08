import { FastifyInstance } from 'fastify';
import { EventTypeRepository } from '../repositories/event-type.repository.js';
import { SlotRepository } from '../repositories/slot.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { EventTypeService } from '../services/event-type.service.js';
import { SlotService } from '../services/slot.service.js';
import { BookingService } from '../services/booking.service.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { ConflictError } from '../errors/conflict.error.js';

export default async function publicRoutes(fastify: FastifyInstance) {
  const eventTypeRepository = new EventTypeRepository();
  const slotRepository = new SlotRepository();
  const bookingRepository = new BookingRepository();

  const eventTypeService = new EventTypeService(eventTypeRepository);
  const slotService = new SlotService(slotRepository);
  const bookingService = new BookingService(bookingRepository, slotRepository);

  // GET /public/event-types
  fastify.get(
    '/public/event-types',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              eventTypes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    durationMinutes: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const eventTypes = await eventTypeService.getAll();
      return { eventTypes };
    }
  );

  // GET /public/event-types/{id}
  fastify.get(
    '/public/event-types/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              durationMinutes: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return await eventTypeService.getById(id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  // GET /public/event-types/{eventTypeId}/slots
  fastify.get(
    '/public/event-types/:eventTypeId/slots',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            eventTypeId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
          required: ['startDate', 'endDate'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                isAvailable: { type: 'boolean' },
                eventTypeId: { type: 'string', format: 'uuid', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { eventTypeId } = request.params as { eventTypeId: string };
        const query = request.query as any;
        const filters = {
          eventTypeId,
          startDate: new Date(query.startDate),
          endDate: new Date(query.endDate),
        };
        return await slotService.getAll(filters);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  // POST /public/bookings
  fastify.post(
    '/public/bookings',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            eventTypeId: { type: 'string', format: 'uuid' },
            slotId: { type: 'string', format: 'uuid' },
            guestName: { type: 'string', minLength: 1, maxLength: 100 },
            guestEmail: { type: 'string', format: 'email' },
            guestNotes: { type: 'string', nullable: true, maxLength: 1000 },
          },
          required: ['eventTypeId', 'slotId', 'guestName', 'guestEmail'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              eventTypeId: { type: 'string', format: 'uuid' },
              slotId: { type: 'string', format: 'uuid' },
              guestName: { type: 'string' },
              guestEmail: { type: 'string', format: 'email' },
              guestNotes: { type: 'string', nullable: true },
              status: { type: 'string' },
              ownerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = request.body as any;
        // Получаем eventType чтобы узнать ownerId
        const eventType = await eventTypeService.getById(data.eventTypeId);
        const bookingData = {
          ...data,
          ownerId: eventType.ownerId,
        };
        const booking = await bookingService.create(bookingData);
        return reply.code(201).send(booking);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        if (error instanceof ConflictError) {
          return reply.code(409).send({
            error: 'Conflict',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  // GET /public/bookings/{id}
  fastify.get(
    '/public/bookings/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              eventTypeId: { type: 'string', format: 'uuid' },
              slotId: { type: 'string', format: 'uuid' },
              guestName: { type: 'string' },
              guestEmail: { type: 'string', format: 'email' },
              guestNotes: { type: 'string', nullable: true },
              status: { type: 'string' },
              ownerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              eventType: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  durationMinutes: { type: 'integer' },
                },
              },
              slot: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return await bookingService.getById(id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );

  // POST /public/bookings/{id}/cancel
  fastify.post(
    '/public/bookings/:id/cancel',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string', maxLength: 500 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              eventTypeId: { type: 'string', format: 'uuid' },
              slotId: { type: 'string', format: 'uuid' },
              guestName: { type: 'string' },
              guestEmail: { type: 'string', format: 'email' },
              guestNotes: { type: 'string', nullable: true },
              status: { type: 'string' },
              ownerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const booking = await bookingService.cancel(id);
        return booking;
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        throw error;
      }
    }
  );
}