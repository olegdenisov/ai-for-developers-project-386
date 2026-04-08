import { FastifyInstance } from 'fastify';
import { SlotRepository } from '../repositories/slot.repository.js';
import { SlotService } from '../services/slot.service.js';
import {
  CreateSlotSchema,
  UpdateSlotSchema,
  SlotParamsSchema,
  SlotQuerySchema,
} from '../validators/slot.validator.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { ConflictError } from '../errors/conflict.error.js';

export default async function slotRoutes(fastify: FastifyInstance) {
  const slotRepository = new SlotRepository();
  const slotService = new SlotService(slotRepository);

  // GET /slots
  fastify.get(
    '/slots',
    {
      schema: {
        querystring: SlotQuerySchema,
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
                ownerId: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as any;
      const filters: any = {};
      filters.startDate = new Date(query.startDate);
      filters.endDate = new Date(query.endDate);
      if (query.eventTypeId) filters.eventTypeId = query.eventTypeId;
      if (query.ownerId) filters.ownerId = query.ownerId;
      if (query.isAvailable !== undefined) filters.isAvailable = query.isAvailable;
      return slotService.getAll(filters);
    }
  );

  // GET /slots/:id
  fastify.get(
    '/slots/:id',
    {
      schema: {
        params: SlotParamsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              isAvailable: { type: 'boolean' },
              eventTypeId: { type: 'string', format: 'uuid', nullable: true },
              ownerId: { type: 'string', format: 'uuid' },
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
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        return await slotService.getById(id);
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

  // POST /slots
  fastify.post(
    '/slots',
    {
      schema: {
        body: CreateSlotSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              isAvailable: { type: 'boolean' },
              eventTypeId: { type: 'string', format: 'uuid', nullable: true },
              ownerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
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
        data.startTime = new Date(data.startTime);
        data.endTime = new Date(data.endTime);
        const slot = await slotService.create(data);
        return reply.code(201).send(slot);
      } catch (error) {
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

  // PUT /slots/:id
  fastify.put(
    '/slots/:id',
    {
      schema: {
        params: SlotParamsSchema,
        body: UpdateSlotSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              isAvailable: { type: 'boolean' },
              eventTypeId: { type: 'string', format: 'uuid', nullable: true },
              ownerId: { type: 'string', format: 'uuid' },
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
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const data = request.body as any;
        const slot = await slotService.update(id, data);
        return slot;
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

  // DELETE /slots/:id
  fastify.delete(
    '/slots/:id',
    {
      schema: {
        params: SlotParamsSchema,
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
        await slotService.delete(id);
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

  // POST /slots/generate
  fastify.post(
    '/slots/generate',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            ownerId: { type: 'string', format: 'uuid' },
            eventTypeId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            intervalMinutes: { type: 'integer', minimum: 1, maximum: 1440, default: 60 },
          },
          required: ['ownerId', 'eventTypeId', 'startDate', 'endDate'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              generated: { type: 'integer' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
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
        const data = request.body as any;
        const generated = await slotService.generateSlots(
          data.ownerId,
          data.eventTypeId,
          new Date(data.startDate),
          new Date(data.endDate),
          data.intervalMinutes || 60
        );
        return { generated };
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: 'Not Found',
            message: error.message,
          });
        }
        // Возможна ошибка валидации
        return reply.code(400).send({
          error: 'Bad Request',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}