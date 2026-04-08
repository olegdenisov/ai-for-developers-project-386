import { FastifyInstance } from 'fastify';
import { OwnerRepository } from '../repositories/owner.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { OwnerService } from '../services/owner.service.js';
import { NotFoundError } from '../errors/not-found.error.js';

export default async function ownerRoutes(fastify: FastifyInstance) {
  const ownerRepository = new OwnerRepository();
  const bookingRepository = new BookingRepository();
  const ownerService = new OwnerService(ownerRepository, bookingRepository);

  // GET /owner/profile
  fastify.get(
    '/owner/profile',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              isPredefined: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
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
    async (_request, reply) => {
      try {
        return await ownerService.getProfile();
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



  // GET /owner/bookings
  fastify.get(
    '/owner/bookings',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              bookings: {
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
              total: { type: 'integer' },
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
        const query = request.query as any;
        const filters = {
          status: query.status,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        const pagination = {
          page: query.page ? Number(query.page) : 1,
          pageSize: query.pageSize ? Number(query.pageSize) : 20,
        };
        const result = await ownerService.getUpcomingBookings(filters, pagination);
        reply.header('X-Total-Count', result.total);
        return { bookings: result.bookings };
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