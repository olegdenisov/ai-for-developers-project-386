import { BookingRepository, CreateBookingData, UpdateBookingData, BookingFilters } from '../repositories/booking.repository.js';
import { SlotRepository } from '../repositories/slot.repository.js';
import { NotFoundError } from '../errors/not-found.error.js';
import { ConflictError } from '../errors/conflict.error.js';

export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly slotRepository: SlotRepository
  ) {}

  async getAll(filters: BookingFilters = {}) {
    return this.bookingRepository.findAll(filters);
  }

  async getById(id: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking with id ${id} not found`);
    }
    return booking;
  }

  async create(data: CreateBookingData) {
    // Проверяем, существует ли слот
    const slot = await this.slotRepository.findById(data.slotId);
    if (!slot) {
      throw new NotFoundError(`Slot with id ${data.slotId} not found`);
    }

    // Проверяем, доступен ли слот
    if (!slot.isAvailable) {
      throw new ConflictError('Slot is not available');
    }

    // Проверяем, не занят ли уже слот
    const existingBooking = await this.bookingRepository.findBySlotId(data.slotId);
    if (existingBooking) {
      throw new ConflictError('Slot already booked');
    }

    // Создаём бронирование
    const booking = await this.bookingRepository.create(data);

    // Обновляем слот как занятый
    await this.slotRepository.update(data.slotId, { isAvailable: false });

    return booking;
  }

  async update(id: string, data: UpdateBookingData) {
    const exists = await this.bookingRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`Booking with id ${id} not found`);
    }
    return this.bookingRepository.update(id, data);
  }

  async cancel(id: string) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking with id ${id} not found`);
    }

    // Обновляем статус
    const updated = await this.bookingRepository.update(id, { status: 'cancelled' });

    // Освобождаем слот
    await this.slotRepository.update(booking.slotId, { isAvailable: true });

    return updated;
  }

  async delete(id: string) {
    const exists = await this.bookingRepository.exists(id);
    if (!exists) {
      throw new NotFoundError(`Booking with id ${id} not found`);
    }
    return this.bookingRepository.delete(id);
  }
}