import { Prisma } from '../../../prisma/generated/client/index.js';
import { prisma } from '../../main.js';
import { NotFoundError, ValidationError } from '../../common/errors/customErrors.js';

export async function listAvailableSlots(filters: {
  eventTypeId?: string;
  startDate: string;
  endDate: string;
}) {
  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  if (start > end) {
    throw new ValidationError('startDate must be before endDate');
  }

  const where: Prisma.SlotWhereInput = {
    isAvailable: true,
    startTime: {
      gte: start,
      lte: end,
    },
  };

  // If eventTypeId is provided, we could filter by duration compatibility
  // For now, we return all available slots
  if (filters.eventTypeId) {
    // Verify event type exists
    const eventType = await prisma.eventType.findUnique({
      where: { id: filters.eventTypeId },
    });

    if (!eventType) {
      throw new NotFoundError('Event type not found');
    }
  }

  return prisma.slot.findMany({
    where,
    orderBy: {
      startTime: 'asc',
    },
  });
}

export async function getSlotById(id: string) {
  const slot = await prisma.slot.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          eventType: true,
        },
      },
    },
  });

  if (!slot) {
    throw new NotFoundError('Slot not found');
  }

  return slot;
}

// Генерация слотов для конкретного типа события
export async function generateSlots(
  eventTypeId: string,
  durationMinutes: number,
  startDate: Date,
  endDate: Date,
  options: {
    startHour?: number;
    endHour?: number;
  } = {}
) {
  const {
    startHour = 9,
    endHour = 17,
  } = options;

  const slots = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Пропускаем выходные
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += durationMinutes) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Не создаём слот если он выходит за пределы рабочего дня
          if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
            break;
          }

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable: true,
            eventTypeId,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  // Создаём слоты в БД пачками для производительности
  await prisma.slot.createMany({ data: slots });

  return slots.length;
}
