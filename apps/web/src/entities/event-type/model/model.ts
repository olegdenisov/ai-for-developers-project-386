import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { apiClient } from '@shared/api';
import { EventType } from './types';

// Atom to store the list of event types
export const eventTypesAtom = atom<EventType[]>([], 'eventTypes');

// Atom to store the currently selected event type
export const selectedEventTypeAtom = atom<EventType | null>(null, 'selectedEventType');

// Async action to fetch all public event types
export const fetchEventTypes = action(async () => {
  const response = await wrap(apiClient.listPublicEventTypes());
  if (response.status >= 400) {
    throw new Error('Failed to fetch event types');
  }
  const eventTypes = Array.isArray(response.data) ? response.data : [];
  eventTypesAtom.set(eventTypes);
  return eventTypes;
}, 'fetchEventTypes').extend(withAsync());

// Async action to fetch a single event type by ID
export const fetchEventTypeById = action(async (id: string) => {
  const response = await wrap(apiClient.getPublicEventType(id));
  if (response.status >= 400) {
    throw new Error('Failed to fetch event type');
  }
  const eventType = response.data;
  selectedEventTypeAtom.set(eventType);
  return eventType;
}, 'fetchEventTypeById').extend(withAsync());

// Computed: check if currently fetching
export const isFetchingEventTypes = computed(() => {
  return fetchEventTypes.pending() > 0;
}, 'isFetchingEventTypes');

export const isFetchingEventType = computed(() => {
  return fetchEventTypeById.pending() > 0;
}, 'isFetchingEventType');
