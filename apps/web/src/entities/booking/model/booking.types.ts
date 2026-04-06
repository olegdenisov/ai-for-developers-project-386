import { EventType } from '@entities/event-type';
import { Slot } from '@entities/slot';

// Domain types for Booking entity
export interface Booking {
  id: string;
  eventTypeId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestNotes: string | null;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  eventType: EventType;
  slot: Slot;
}

export interface CreateBookingRequest {
  eventTypeId: string;
  slotId: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
}

export interface CancelBookingRequest {
  reason?: string;
}
