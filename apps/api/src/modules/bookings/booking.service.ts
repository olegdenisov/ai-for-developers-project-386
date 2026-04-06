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
  // Verify event type exists
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

  // Get slots that match the event duration
  const slots = await prisma.slot.findMany({
    where: {
      isAvailable: true,
      startTime: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Filter slots by duration compatibility
  return slots.filter(slot => {
    const slotDuration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000;
    return slotDuration >= eventType.durationMinutes;
  });
}

export async function createBooking(data: {
  eventTypeId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
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

    // 4. Check slot duration compatibility
    const slotDuration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000;
    if (slotDuration < eventType.durationMinutes) {
      throw new ValidationError('Slot duration is too short for this event type');
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

export async function cancelBooking(
  id: string,
  data?: { reason?: string }
) {
  return await prisma.$transaction(async (tx) => {
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
