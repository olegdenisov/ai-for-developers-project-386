import { reatomRoute, wrap, atom, computed } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { z } from 'zod';
import { PublicApi } from '@calendar-booking/api-client';
import { EventTypePage } from './EventTypePage';
import type { EventType } from '@entities/event-type';
import type { Slot } from '@entities/slot';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// ============================================
// EVENT TYPE ROUTE
// ============================================

/**
 * Event type route - displays event type details and available time slots
 * Path: /event-types/:id
 */
export const eventTypeRoute = reatomRoute({
  path: '/event-types/:id',
  
  /**
   * Params validation with Zod
   * Validates that id is a valid UUID string
   */
  params: z.object({
    id: z.string().uuid(),
  }),
  
  /**
   * Loader fetches event type details and available slots
   */
  async loader(params) {
    // Fetch event type by ID
    const eventTypeResponse = await wrap(api.getPublicEventType(params.id));
    if (!eventTypeResponse.ok) {
      throw new Error('Failed to fetch event type');
    }
    const eventType: EventType = await wrap(eventTypeResponse.json());
    
    return { eventType };
  },
  
  /**
   * Render function returns React component
   */
  render(self): RouteChild {
    const { isPending, data, error } = self.status();
    
    if (isPending) {
      return <EventTypePage isLoading={true} />;
    }
    
    if (error) {
      return <EventTypePage isLoading={false} error={error.message} />;
    }
    
    if (!data) {
      return <EventTypePage isLoading={false} error="Event type not found" />;
    }
    
    return (
      <EventTypePage 
        eventType={data.eventType}
        isLoading={false}
      />
    );
  },
});

// ============================================
// SLOTS LOADER (separate computed for slots fetching)
// ============================================

/**
 * Computed that fetches available slots for selected date
 * This is separate from route loader to avoid refetching event type on date change
 */
export const slotsForDate = computed(async () => {
  const params = eventTypeRoute();
  if (!params) return [];
  
  // Get selected date from the component state (passed via atom)
  const selectedDate = selectedDateForRoute();
  if (!selectedDate) return [];
  
  // Calculate date range (start of week to end of week)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  const response = await wrap(api.getAvailableSlotsForEventType(
    params.id,
    startDate,
    endDate
  ));
  
  if (!response.ok) {
    throw new Error('Failed to fetch available slots');
  }
  
  return await wrap(response.json());
}, 'slotsForDate').extend((target) => ({
  // Add retry action
  retry() {
    target.retry();
  },
}));

/**
 * Atom to store selected date for the route
 * Used by slotsForDate computed
 */
export const selectedDateForRoute = atom<Date | null>(null, 'selectedDateForRoute');

// ============================================
// EXPORTS
// ============================================

export type EventTypeRoute = typeof eventTypeRoute;
