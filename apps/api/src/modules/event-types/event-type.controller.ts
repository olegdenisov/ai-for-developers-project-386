import { FastifyRequest, FastifyReply } from 'fastify';
import * as eventTypeService from './event-type.service.js';

export async function listEventTypes(request: FastifyRequest, reply: FastifyReply) {
  const eventTypes = await eventTypeService.listEventTypes();
  return reply.send(eventTypes);
}

export async function getEventType(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const eventType = await eventTypeService.getEventTypeById(request.params.id);
  return reply.send(eventType);
}

export async function createEventType(
  request: FastifyRequest<{ Body: { name: string; description?: string; durationMinutes: number } }>,
  reply: FastifyReply
) {
  const eventType = await eventTypeService.createEventType(request.body);
  return reply.status(201).send(eventType);
}

export async function updateEventType(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { name?: string; description?: string; durationMinutes?: number };
  }>,
  reply: FastifyReply
) {
  const eventType = await eventTypeService.updateEventType(request.params.id, request.body);
  return reply.send(eventType);
}

export async function deleteEventType(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await eventTypeService.deleteEventType(request.params.id);
  return reply.status(204).send();
}
