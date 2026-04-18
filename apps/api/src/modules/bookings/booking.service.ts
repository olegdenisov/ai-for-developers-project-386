import { Prisma } from '../../../prisma/generated/client/index.js';
import { prisma } from '../../main.js';
import {
  NotFoundError,
  SlotConflictError,
  ValidationError
} from '../../common/errors/customErrors.js';

// Re-export event type functions for public API
export async function listPublicEventTypes() {
  return prisma.eventType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getPublicEventTypeById(id: string) {
  const eventType = await prisma.eventType.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!eventType) {
    throw new NotFoundError('Event type not found');
  }

  return eventType;
}

export async function getAvailableSlotsForEventType(
  eventTypeId: string,
  filters: {
    startDate: string;
    endDate: string;
  }
) {
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });

  if (!eventType) {
    throw new NotFoundError('Event type not found');
  }

  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  // Слоты только для данного типа события в запрошенном диапазоне (только доступные).
  // booking: null исключает слоты с отменёнными бронированиями: из-за @unique на slotId
  // запись Booking остаётся в БД даже после отмены, делая слот фактически недоступным.
  const slots = await prisma.slot.findMany({
    where: {
      eventTypeId,
      isAvailable: true,
      booking: null,
      startTime: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return slots;
}

export async function createBooking(data: {
  eventTypeId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
}) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Check if slot exists and is available (WITH LOCK)
    const slot = await tx.slot.findUnique({
      where: { id: data.slotId },
      include: { booking: true },
    });

    if (!slot) {
      throw new NotFoundError('Slot not found');
    }

    // 2. BUSINESS RULE: No double booking at the same time
    if (slot.booking || !slot.isAvailable) {
      throw new SlotConflictError();
    }

    // 3. Check if event type exists
    const eventType = await tx.eventType.findUnique({
      where: { id: data.eventTypeId },
    });

    if (!eventType) {
      throw new NotFoundError('Event type not found');
    }

    // 4. Проверяем что слот принадлежит запрошенному типу события
    if (slot.eventTypeId !== data.eventTypeId) {
      throw new ValidationError('Slot does not belong to the requested event type');
    }

    // 5. Create booking and mark slot as unavailable
    const [booking] = await Promise.all([
      tx.booking.create({
        data: {
          eventTypeId: data.eventTypeId,
          slotId: data.slotId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestNotes: data.guestNotes,
          status: 'CONFIRMED',
        },
        include: {
          eventType: true,
          slot: true,
        },
      }),
      tx.slot.update({
        where: { id: data.slotId },
        data: { isAvailable: false },
      }),
    ]);

    return booking;
  }, {
    // Transaction options for better isolation
    isolationLevel: 'Serializable',
  });
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      eventType: true,
      slot: true,
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  return booking;
}

export async function rescheduleBooking(id: string, newSlotId: string) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Найти бронирование
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ValidationError('Only confirmed bookings can be rescheduled');
    }

    // 2. Проверить, что не переносят на тот же слот
    if (booking.slotId === newSlotId) {
      throw new ValidationError('New slot must be different from the current slot');
    }

    // 3. Найти новый слот (с включением связанного бронирования для проверки уникальности)
    const newSlot = await tx.slot.findUnique({
      where: { id: newSlotId },
      include: { booking: true },
    });

    if (!newSlot) {
      throw new NotFoundError('New slot not found');
    }

    // 4. Проверить, что новый слот принадлежит тому же типу события
    if (newSlot.eventTypeId !== booking.eventTypeId) {
      throw new ValidationError('New slot belongs to a different event type');
    }

    // 5. Проверить доступность нового слота.
    // Также проверяем наличие любого бронирования (в том числе отменённого):
    // из-за @unique на slotId отменённые записи по-прежнему занимают слот,
    // и попытка переноса к ним вызовет ошибку уникальности на уровне БД.
    if (!newSlot.isAvailable || newSlot.booking) {
      throw new SlotConflictError();
    }

    // 6. Освободить старый слот и занять новый (до обновления бронирования),
    // чтобы include: { slot: true } в следующем запросе вернул актуальный isAvailable.
    await Promise.all([
      tx.slot.update({
        where: { id: booking.slotId },
        data: { isAvailable: true },
      }),
      tx.slot.update({
        where: { id: newSlotId },
        data: { isAvailable: false },
      }),
    ]);

    // 7. Обновить бронирование — читает slot после обновления выше
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { slotId: newSlotId },
      include: {
        eventType: true,
        slot: true,
      },
    });

    return updatedBooking;
  }, {
    isolationLevel: 'Serializable',
  });
}

export async function cancelBooking(
  id: string,
  data?: { reason?: string }
) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Check if booking exists and is not already cancelled
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new ValidationError('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new ValidationError('Cannot cancel completed booking');
    }

    // Cancel booking and free the slot
    const [updatedBooking] = await Promise.all([
      tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          eventType: true,
          slot: true,
        },
      }),
      tx.slot.update({
        where: { id: booking.slotId },
        data: { isAvailable: true },
      }),
    ]);

    return updatedBooking;
  }, {
    isolationLevel: 'Serializable',
  });
}
