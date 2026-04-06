import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { PublicApi } from '@calendar-booking/api-client';
import { EventType } from './types';

const api = new PublicApi(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// Atom to store the list of event types
export const eventTypesAtom = atom<EventType[]>([], 'eventTypes');

// Atom to store the currently selected event type
export const selectedEventTypeAtom = atom<EventType | null>(null, 'selectedEventType');

// Async action to fetch all public event types
export const fetchEventTypes = action(async () => {
  const response = await wrap(api.listPublicEventTypes());
  if (!response.ok) {
    throw new Error('Failed to fetch event types');
  }
  const data = await wrap(response.json());
  const eventTypes = data.eventTypes || [];
  eventTypesAtom.set(eventTypes);
  return eventTypes;
}, 'fetchEventTypes').extend(withAsync());

// Async action to fetch a single event type by ID
export const fetchEventTypeById = action(async (id: string) => {
  const response = await wrap(api.getPublicEventType(id));
  if (!response.ok) {
    throw new Error('Failed to fetch event type');
  }
  const eventType = await wrap(response.json());
  selectedEventTypeAtom.set(eventType);
  return eventType;
}, 'fetchEventTypeById').extend(withAsync());

// Computed: check if currently fetching
export const isFetchingEventTypes = computed(() => {
  return fetchEventTypes.pending();
}, 'isFetchingEventTypes');

export const isFetchingEventType = computed(() => {
  return fetchEventTypeById.pending();
}, 'isFetchingEventType');
