import { SlotRepository, SlotFilters, CreateSlotData } from '../repositories/slot.repository.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { ConflictError } from '../errors/conflict.error.js';

export class SlotService {
  constructor(private readonly slotRepository: SlotRepository) {}

  async getAll(filters: SlotFilters = {}) {
    return this.slotRepository.findAll(filters);
  }

  async getById(id: string) {
    const slot = await this.slotRepository.findById(id);
    if (!slot) {
      throw new NotFoundError(`Slot with id ${id} not found`);
    }
    return slot;
  }

  async create(data: CreateSlotData) {
    // Проверка на конфликты
    const conflicting = await this.slotRepository.findConflicting(
      data.startTime,
      data.endTime,
      data.ownerId
    );
    if (conflicting.length > 0) {
      throw new ConflictError('Slot conflicts with existing slots');
    }
    return this.slotRepository.create(data);
  }

  async generateSlots(
    ownerId: string,
    eventTypeId: string,
    startDate: Date,
    endDate: Date,
    intervalMinutes: number = 60
  ) {
    const slots: CreateSlotData[] = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60000);

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true,
        eventTypeId,
        ownerId,
      });

      current = slotEnd;
    }

    if (slots.length > 0) {
      await this.slotRepository.createMany(slots);
    }

    return slots.length;
  }

  async update(id: string, data: any) {
    const exists = await this.slotRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`Slot with id ${id} not found`);
    }
    return this.slotRepository.update(id, data);
  }

  async delete(id: string) {
    const exists = await this.slotRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`Slot with id ${id} not found`);
    }
    return this.slotRepository.delete(id);
  }
}