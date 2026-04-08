import prisma from '../db.js';

export interface CreateEventTypeData {
  name: string;
  description?: string;
  durationMinutes: number;
  ownerId: string;
}

export interface UpdateEventTypeData {
  name?: string;
  description?: string | null;
  durationMinutes?: number;
}

export class EventTypeRepository {
  async findAll(): Promise<any[]> {
    return prisma.eventType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.eventType.findUnique({
      where: { id },
    });
  }

  async create(data: CreateEventTypeData): Promise<any> {
    return prisma.eventType.create({
      data,
    });
  }

  async update(id: string, data: UpdateEventTypeData): Promise<any> {
    return prisma.eventType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<any> {
    return prisma.eventType.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.eventType.count({
      where: { id },
    });
    return count > 0;
  }
}