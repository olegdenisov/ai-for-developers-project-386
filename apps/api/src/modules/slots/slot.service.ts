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

  const where: any = {
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

export async function getSlotsForEventType(
  eventTypeId: string,
  filters: {
    startDate: string;
    endDate: string;
  }
) {
  // Verify event type exists
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });

  if (!eventType) {
    throw new NotFoundError('Event type not found');
  }

  return listAvailableSlots({
    eventTypeId,
    ...filters,
  });
}

// Helper function to generate slots (can be used for admin/seeding)
export async function generateSlots(
  startDate: Date,
  endDate: Date,
  options: {
    startHour?: number;
    endHour?: number;
    intervalMinutes?: number;
  } = {}
) {
  const {
    startHour = 9,
    endHour = 17,
    intervalMinutes = 30,
  } = options;

  const slots = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable: true,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  // Create slots in database
  const createdSlots = await Promise.all(
    slots.map(slot =>
      prisma.slot.create({
        data: slot,
      })
    )
  );

  return createdSlots;
}
