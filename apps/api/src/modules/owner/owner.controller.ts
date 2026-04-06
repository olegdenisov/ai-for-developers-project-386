import { FastifyRequest, FastifyReply } from 'fastify';
import * as ownerService from './owner.service.js';

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const owner = await ownerService.getPredefinedOwner();
  return reply.send(owner);
}

export async function getUpcomingBookings(
  request: FastifyRequest<{
    Querystring: {
      status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    };
  }>,
  reply: FastifyReply
) {
  const result = await ownerService.getUpcomingBookings(request.query);
  
  reply.header('X-Total-Count', result.totalCount);
  return reply.send(result.bookings);
}
