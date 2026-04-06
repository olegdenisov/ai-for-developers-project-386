// Public API for slot entity
export { Slot, SlotWithBooking } from './model/slot.types';
export {
  availableSlotsAtom,
  selectedSlotAtom,
  slotsDateRangeAtom,
  fetchAvailableSlots,
  fetchSlotById,
  selectSlot,
  clearSelectedSlot,
} from './model/slot.atom';
