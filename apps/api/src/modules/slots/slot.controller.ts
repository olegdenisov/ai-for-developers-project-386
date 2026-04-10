import { FastifyRequest, FastifyReply } from 'fastify';
import * as slotService from './slot.service.js';

export async function listAvailableSlots(
  request: FastifyRequest<{
    Querystring: {
      eventTypeId?: string;
      startDate: string;
      endDate: string;
    };
  }>,
  reply: FastifyReply
) {
  const slots = await slotService.listAvailableSlots(request.query);
  return reply.send(slots);
}

export async function getSlot(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const slot = await slotService.getSlotById(request.params.id);
  return reply.send(slot);
}
