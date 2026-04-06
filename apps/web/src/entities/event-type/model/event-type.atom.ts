import { atom } from '@reatom/core';
import { reatomAsync } from '@reatom/async';
import { PublicApi } from '@calendar-booking/api-client';
import { EventType } from './event-type.types';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Atom to store the list of event types
export const eventTypesAtom = atom<EventType[]>([], 'eventTypes');

// Atom to store the currently selected event type
export const selectedEventTypeAtom = atom<EventType | null>(null, 'selectedEventType');

// Async action to fetch all public event types
export const fetchEventTypes = reatomAsync(
  async (ctx) => {
    const response = await api.listPublicEventTypes();
    if (!response.ok) {
      throw new Error('Failed to fetch event types');
    }
    const data = await response.json();
    const eventTypes = data.eventTypes || [];
    eventTypesAtom(ctx, eventTypes);
    return eventTypes;
  },
  'fetchEventTypes'
);

// Auto-fetch on connect
fetchEventTypes.onConnect((ctx) => {
  fetchEventTypes(ctx);
});

// Async action to fetch a single event type by ID
export const fetchEventTypeById = reatomAsync(
  async (ctx, id: string) => {
    const response = await api.getPublicEventType(id);
    if (!response.ok) {
      throw new Error('Failed to fetch event type');
    }
    const eventType = await response.json();
    selectedEventTypeAtom(ctx, eventType);
    return eventType;
  },
  'fetchEventTypeById'
);
