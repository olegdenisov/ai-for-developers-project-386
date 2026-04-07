// Public API for create-booking feature
export { bookingFormSchema, type BookingFormData, validateBookingForm } from './model/validation';
export {
  bookingFormAtom,
  formErrorsAtom,
  updateFormField,
  setFormErrors,
  clearForm,
  submitBookingForm,
} from './model/model';

// Shared state for cross-page booking context
export {
  bookingEventTypeAtom,
  bookingSlotAtom,
  submitBooking,
} from './model/model';
