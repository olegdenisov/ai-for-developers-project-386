import prisma from '../db.js';

export interface CreateSlotData {
  startTime: Date;
  endTime: Date;
  isAvailable?: boolean;
  eventTypeId?: string;
  ownerId: string;
}

export interface UpdateSlotData {
  isAvailable?: boolean;
  eventTypeId?: string | null;
}

export interface SlotFilters {
  startDate?: Date;
  endDate?: Date;
  eventTypeId?: string;
  ownerId?: string;
  isAvailable?: boolean;
}

export class SlotRepository {
  async findAll(filters: SlotFilters = {}): Promise<any[]> {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    if (filters.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    return prisma.slot.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.slot.findUnique({
      where: { id },
    });
  }

  async create(data: CreateSlotData): Promise<any> {
    return prisma.slot.create({
      data,
    });
  }

  async createMany(data: CreateSlotData[]): Promise<any> {
    return prisma.slot.createMany({
      data,
    });
  }

  async update(id: string, data: UpdateSlotData): Promise<any> {
    return prisma.slot.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<any> {
    return prisma.slot.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.slot.count({
      where: { id },
    });
    return count > 0;
  }

  async findConflicting(startTime: Date, endTime: Date, ownerId: string): Promise<any[]> {
    return prisma.slot.findMany({
      where: {
        ownerId,
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });
  }
}