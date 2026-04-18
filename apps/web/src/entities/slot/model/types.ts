import type { BookingStatus } from '@calendar-booking/api-client'

export type { Slot } from '@calendar-booking/api-client'

// Слот с данными бронирования для административного представления
export interface SlotWithBooking {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
  booking?: {
    id: string;
    guestName: string;
    guestEmail: string;
    status: BookingStatus;
    eventType: {
      id: string;
      name: string;
    };
  } | null;
}
