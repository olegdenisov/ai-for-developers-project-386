// Public API for slot entity
export type { Slot, SlotWithBooking } from './model/types';
export {
  availableSlotsAtom,
  selectedSlotAtom,
  slotsDateRangeAtom,
  fetchAvailableSlots,
  selectSlot,
  clearSelectedSlot,
  isFetchingSlots,
} from './model/model';
