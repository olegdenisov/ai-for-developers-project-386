import { FastifyRequest, FastifyReply } from 'fastify';
import * as bookingService from './booking.service.js';

export async function listPublicEventTypes(request: FastifyRequest, reply: FastifyReply) {
  const eventTypes = await bookingService.listPublicEventTypes();
  return reply.send(eventTypes);
}

export async function getPublicEventType(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const eventType = await bookingService.getPublicEventTypeById(request.params.id);
  return reply.send(eventType);
}

export async function getAvailableSlotsForEventType(
  request: FastifyRequest<{
    Params: { eventTypeId: string };
    Querystring: { startDate: string; endDate: string };
  }>,
  reply: FastifyReply
) {
  const slots = await bookingService.getAvailableSlotsForEventType(
    request.params.eventTypeId,
    request.query
  );
  return reply.send(slots);
}

export async function createBooking(
  request: FastifyRequest<{
    Body: {
      eventTypeId: string;
      slotId: string;
      guestName: string;
      guestEmail: string;
      guestNotes?: string;
    };
  }>,
  reply: FastifyReply
) {
  const booking = await bookingService.createBooking(request.body);
  return reply.status(201).send(booking);
}

export async function getBooking(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const booking = await bookingService.getBookingById(request.params.id);
  return reply.send(booking);
}

export async function cancelBooking(
  request: FastifyRequest<{
    Params: { id: string };
    Body?: { reason?: string };
  }>,
  reply: FastifyReply
) {
  const booking = await bookingService.cancelBooking(request.params.id, request.body);
  return reply.send(booking);
}

export async function rescheduleBooking(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { newSlotId: string };
  }>,
  reply: FastifyReply
) {
  const booking = await bookingService.rescheduleBooking(request.params.id, request.body.newSlotId);
  return reply.send(booking);
}
