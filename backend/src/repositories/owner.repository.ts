import prisma from '../db.js';

export class OwnerRepository {
  async findPredefined(): Promise<any | null> {
    return prisma.owner.findFirst({
      where: { isPredefined: true },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.owner.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return prisma.owner.update({
      where: { id },
      data,
    });
  }
}