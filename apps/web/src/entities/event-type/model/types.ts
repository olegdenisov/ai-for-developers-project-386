import { components } from "@calendar-booking/shared-types";

// Domain types for Event Type entity
export type EventType = components['schemas']['EventType']

export interface CreateEventTypeRequest {
  name: string;
  description?: string;
  durationMinutes: number;
}

export interface UpdateEventTypeRequest {
  name?: string;
  description?: string;
  durationMinutes?: number;
}
