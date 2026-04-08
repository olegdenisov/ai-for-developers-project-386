import { EventTypeRepository, CreateEventTypeData, UpdateEventTypeData } from '../repositories/event-type.repository.js';
import { NotFoundError } from '../errors/not-found.error.js';

export class EventTypeService {
  constructor(private readonly eventTypeRepository: EventTypeRepository) {}

  async getAll() {
    return this.eventTypeRepository.findAll();
  }

  async getById(id: string) {
    const eventType = await this.eventTypeRepository.findById(id);
    if (!eventType) {
      throw new NotFoundError(`EventType with id ${id} not found`);
    }
    return eventType;
  }

  async create(data: CreateEventTypeData) {
    // Валидация данных должна быть выполнена на уровне маршрута
    return this.eventTypeRepository.create(data);
  }

  async update(id: string, data: UpdateEventTypeData) {
    const exists = await this.eventTypeRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`EventType with id ${id} not found`);
    }
    return this.eventTypeRepository.update(id, data);
  }

  async delete(id: string) {
    const exists = await this.eventTypeRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`EventType with id ${id} not found`);
    }
    return this.eventTypeRepository.delete(id);
  }
}