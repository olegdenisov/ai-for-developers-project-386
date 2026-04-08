import { OwnerRepository } from '../repositories/owner.repository.js';
import { BookingRepository, BookingPaginationOptions } from '../repositories/booking.repository.js';
import { NotFoundError } from '../errors/not-found.error.js';

export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly bookingRepository: BookingRepository
  ) {}

  async getProfile() {
    const owner = await this.ownerRepository.findPredefined();
    if (!owner) {
      throw new NotFoundError('Predefined owner not found');
    }
    return owner;
  }

  async getProfileById(id: string) {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundError(`Owner with id ${id} not found`);
    }
    return owner;
  }

  async updateProfile(id: string, data: any) {
    const exists = await this.ownerRepository.findById(id);
    if (!exists) {
      throw new NotFoundError(`Owner with id ${id} not found`);
    }
    return this.ownerRepository.update(id, data);
  }

  async getUpcomingBookings(
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: {
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    // Получаем предопределённого владельца
    const owner = await this.ownerRepository.findPredefined();
    if (!owner) {
      throw new NotFoundError('Predefined owner not found');
    }

    const { page = 1, pageSize = 20 } = pagination;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const options: BookingPaginationOptions = {
      ownerId: owner.id,
      ...filters,
      skip,
      take,
    };

    const { data, total } = await this.bookingRepository.findAllWithPagination(options);
    return { bookings: data, total };
  }
}