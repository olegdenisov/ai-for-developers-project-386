import { FastifyInstance } from 'fastify';
import { EventTypeRepository } from '../repositories/event-type.repository.js';
import { EventTypeService } from '../services/event-type.service.js';
import {
  CreateEventTypeSchema,
  UpdateEventTypeSchema,
  EventTypeParamsSchema,
} from '../validators/event-type.validator.js';
import { NotFoundError } from '../errors/not-found.error.js';

export default async function eventTypeRoutes(fastify: FastifyInstance) {
  const eventTypeRepository = new EventTypeRepository();
  const eventTypeService = new EventTypeService(eventTypeRepository);

  // GET /event-types
  fastify.get(
    '/event-types',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                durationMinutes: { type: 'integer' },
                ownerId: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async () => {
      return eventTypeService.getAll();
    }
  );

  // GET /event-types/:id
  fastify.get(
    '/event-types/:id',
    {
      schema: {
        params: EventTypeParamsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              durationMinutes: { type: 'integer' },
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

  // POST /event-types
  fastify.post(
    '/event-types',
    {
      schema: {
        body: CreateEventTypeSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              durationMinutes: { type: 'integer' },
              ownerId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = request.body as any;
      const eventType = await eventTypeService.create(data);
      return reply.code(201).send(eventType);
    }
  );

  // PUT /event-types/:id
  fastify.put(
    '/event-types/:id',
    {
      schema: {
        params: EventTypeParamsSchema,
        body: UpdateEventTypeSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              durationMinutes: { type: 'integer' },
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
        const eventType = await eventTypeService.update(id, data);
        return eventType;
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

  // DELETE /event-types/:id
  fastify.delete(
    '/event-types/:id',
    {
      schema: {
        params: EventTypeParamsSchema,
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
        await eventTypeService.delete(id);
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