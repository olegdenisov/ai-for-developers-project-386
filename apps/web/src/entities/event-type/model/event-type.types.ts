// Domain types for Event Type entity
export interface EventType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

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
