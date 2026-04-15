import { components } from '@calendar-booking/shared-types';

// Domain types for Booking entity
export type Booking  = components['schemas']['Booking'] 

export type CreateBookingRequest = components['schemas']['CreateBookingRequest']

export interface CancelBookingRequest {
  reason?: string;
}
