import prisma from '../db.js';

export interface CreateBookingData {
  eventTypeId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
  ownerId: string;
}

export interface UpdateBookingData {
  guestName?: string;
  guestEmail?: string;
  guestNotes?: string | null;
  status?: string;
}

export interface BookingFilters {
  ownerId?: string;
  eventTypeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BookingPaginationOptions extends BookingFilters {
  skip?: number;
  take?: number;
}

export class BookingRepository {
  async findAll(filters: BookingFilters = {}): Promise<any[]> {
    const where: any = {};

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.slot = {
        startTime: {},
      };
      if (filters.startDate) {
        where.slot.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.slot.startTime.lte = filters.endDate;
      }
    }

    return prisma.booking.findMany({
      where,
      include: {
        eventType: true,
        slot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllWithPagination(options: BookingPaginationOptions = {}): Promise<{ data: any[]; total: number }> {
    const where: any = {};

    if (options.ownerId) {
      where.ownerId = options.ownerId;
    }

    if (options.eventTypeId) {
      where.eventTypeId = options.eventTypeId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.startDate || options.endDate) {
      where.slot = {
        startTime: {},
      };
      if (options.startDate) {
        where.slot.startTime.gte = options.startDate;
      }
      if (options.endDate) {
        where.slot.startTime.lte = options.endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          eventType: true,
          slot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
      }),
      prisma.booking.count({ where }),
    ]);

    return { data, total };
  }

  async count(filters: BookingFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.slot = {
        startTime: {},
      };
      if (filters.startDate) {
        where.slot.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.slot.startTime.lte = filters.endDate;
      }
    }

    return prisma.booking.count({ where });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        slot: true,
      },
    });
  }

  async create(data: CreateBookingData): Promise<any> {
    return prisma.booking.create({
      data: {
        ...data,
        status: 'confirmed',
      },
      include: {
        eventType: true,
        slot: true,
      },
    });
  }

  async update(id: string, data: UpdateBookingData): Promise<any> {
    return prisma.booking.update({
      where: { id },
      data,
      include: {
        eventType: true,
        slot: true,
      },
    });
  }

  async delete(id: string): Promise<any> {
    return prisma.booking.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.booking.count({
      where: { id },
    });
    return count > 0;
  }

  async findBySlotId(slotId: string): Promise<any | null> {
    return prisma.booking.findFirst({
      where: { slotId },
    });
  }
}