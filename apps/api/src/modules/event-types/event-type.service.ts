import { prisma } from '../../main.js';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors/customErrors.js';
import { getPredefinedOwner } from '../owner/owner.service.js';
import { generateSlots } from '../slots/slot.service.js';

export async function listEventTypes() {
  return prisma.eventType.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getEventTypeById(id: string) {
  const eventType = await prisma.eventType.findUnique({
    where: { id },
  });

  if (!eventType) {
    throw new NotFoundError('Event type not found');
  }

  return eventType;
}

export async function createEventType(data: {
  name: string;
  description?: string;
  durationMinutes: number;
}) {
  // Validate duration
  if (data.durationMinutes < 1 || data.durationMinutes > 480) {
    throw new ValidationError('Invalid duration', [
      { field: 'durationMinutes', message: 'Duration must be between 1 and 480 minutes' },
    ]);
  }

  // Get the predefined owner
  const owner = await getPredefinedOwner();

  const eventType = await prisma.eventType.create({
    data: {
      ...data,
      ownerId: owner.id,
    },
  });

  // Генерируем слоты на 14 дней вперёд
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  await generateSlots(eventType.id, eventType.durationMinutes, today, endDate);

  return eventType;
}

export async function updateEventType(
  id: string,
  data: {
    name?: string;
    description?: string;
    durationMinutes?: number;
  }
) {
  // Check if event type exists
  await getEventTypeById(id);

  // Validate duration if provided
  if (data.durationMinutes !== undefined) {
    if (data.durationMinutes < 1 || data.durationMinutes > 480) {
      throw new ValidationError('Invalid duration', [
        { field: 'durationMinutes', message: 'Duration must be between 1 and 480 minutes' },
      ]);
    }
  }

  const updated = await prisma.eventType.update({
    where: { id },
    data,
  });

  // Если изменилась длительность — пересоздаём незабронированные слоты
  if (data.durationMinutes !== undefined) {
    await prisma.slot.deleteMany({
      where: {
        eventTypeId: id,
        isAvailable: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    await generateSlots(id, updated.durationMinutes, today, endDate);
  }

  return updated;
}

export async function deleteEventType(id: string) {
  // Check if event type exists
  await getEventTypeById(id);

  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      eventTypeId: id,
      status: 'CONFIRMED',
    },
  });

  if (activeBookings > 0) {
    throw new ConflictError(
      `Cannot delete event type with ${activeBookings} active bookings. Please cancel or complete them first.`
    );
  }

  await prisma.eventType.delete({
    where: { id },
  });
}
