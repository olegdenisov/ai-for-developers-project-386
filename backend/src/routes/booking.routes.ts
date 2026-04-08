import { FastifyInstance } from 'fastify';
import { BookingRepository } from '../repositories/booking.repository.js';
import { SlotRepository } from '../repositories/slot.repository.js';
import { BookingService } from '../services/booking.service.js';
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  BookingParamsSchema,
  BookingQuerySchema,
} from '../validators/booking.validator.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { ConflictError } from '../errors/conflict.error.js';

export default async function bookingRoutes(fastify: FastifyInstance) {
  const bookingRepository = new BookingRepository();
  const slotRepository = new SlotRepository();
  const bookingService = new BookingService(bookingRepository, slotRepository);

  // GET /bookings (для владельца)
  fastify.get(
    '/bookings',
    {
      schema: {
        querystring: BookingQuerySchema,
        response: {
          200: {
            type: 'array',
            items: {
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
          },
        },
      },
    },
    async (request) => {
      const query = request.query as any;
      const filters: any = {};
      if (query.ownerId) filters.ownerId = query.ownerId;
      if (query.eventTypeId) filters.eventTypeId = query.eventTypeId;
      if (query.status) filters.status = query.status;
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);
      return bookingService.getAll(filters);
    }
  );

  // GET /bookings/:id
  fastify.get(
    '/bookings/:id',
    {
      schema: {
        params: BookingParamsSchema,
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

  // POST /bookings (публичное бронирование)
  fastify.post(
    '/bookings',
    {
      schema: {
        body: CreateBookingSchema,
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
        const booking = await bookingService.create(data);
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

  // PUT /bookings/:id
  fastify.put(
    '/bookings/:id',
    {
      schema: {
        params: BookingParamsSchema,
        body: UpdateBookingSchema,
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
        const data = request.body as any;
        const booking = await bookingService.update(id, data);
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

  // POST /bookings/:id/cancel
  fastify.post(
    '/bookings/:id/cancel',
    {
      schema: {
        params: BookingParamsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
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

  // DELETE /bookings/:id
  fastify.delete(
    '/bookings/:id',
    {
      schema: {
        params: BookingParamsSchema,
        response: {
          204: { type: 'null' },
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
        await bookingService.delete(id);
        return reply.code(204).send();
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