import { Prisma } from '../../../prisma/generated/client/index.js';
import { prisma } from '../../main.js';
import { NotFoundError } from '../../common/errors/customErrors.js';

export async function getPredefinedOwner() {
  const owner = await prisma.owner.findFirst({
    where: { isPredefined: true },
  });

  if (!owner) {
    throw new NotFoundError('Predefined owner not found');
  }

  return owner;
}

export async function getUpcomingBookings(filters: {
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.BookingWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  const [bookings, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        eventType: true,
        slot: true,
      },
      orderBy: {
        slot: { startTime: 'asc' },
      },
      skip,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, totalCount };
}
