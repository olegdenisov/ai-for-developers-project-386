// Domain types for Slot entity
export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface SlotWithBooking extends Slot {
  booking?: {
    id: string;
    guestName: string;
    guestEmail: string;
    status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    eventType: {
      id: string;
      name: string;
    };
  } | null;
}
