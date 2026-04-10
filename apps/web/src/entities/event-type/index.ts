// Public API for event-type entity
export type { EventType, CreateEventTypeRequest, UpdateEventTypeRequest } from './model/types';
export {
  eventTypesAtom,
  selectedEventTypeAtom,
  fetchEventTypes,
  fetchEventTypeById,
  isFetchingEventTypes,
  isFetchingEventType,
} from './model/model';
