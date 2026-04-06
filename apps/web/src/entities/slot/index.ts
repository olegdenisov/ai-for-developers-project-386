// Public API for slot entity
export { Slot, SlotWithBooking } from './model/slot.types';
export {
  availableSlotsAtom,
  selectedSlotAtom,
  slotsDateRangeAtom,
  fetchAvailableSlots,
  selectSlot,
  clearSelectedSlot,
  isFetchingSlots,
} from './model/slot.atom';
