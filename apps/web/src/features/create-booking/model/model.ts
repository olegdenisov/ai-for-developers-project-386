import { atom, action, wrap, withAsync } from '@reatom/core';
import { createBooking as createBookingEntity } from '@entities/booking';
import { selectedSlotAtom } from '@entities/slot';
import { selectedEventTypeAtom } from '@entities/event-type';
import { BookingFormData, validateBookingForm } from './validation';

// Form state atom
export const bookingFormAtom = atom<Partial<BookingFormData>>(
  { guestName: '', guestEmail: '', guestNotes: '' },
  'bookingForm'
);

// Form errors atom
export const formErrorsAtom = atom<Partial<Record<keyof BookingFormData, string>>>(
  {},
  'formErrors'
);

// Action to update form field
export const updateFormField = action((field: keyof BookingFormData, value: string) => {
  const current = bookingFormAtom();
  bookingFormAtom.set({ ...current, [field]: value });

  // Clear error for this field when user types
  const currentErrors = formErrorsAtom();
  if (currentErrors[field]) {
    formErrorsAtom.set({ ...currentErrors, [field]: undefined });
  }
}, 'updateFormField');

// Action to set form errors
export const setFormErrors = action((errors: Partial<Record<keyof BookingFormData, string>>) => {
  formErrorsAtom.set(errors);
}, 'setFormErrors');

// Action to clear form
export const clearForm = action(() => {
  bookingFormAtom.set({ guestName: '', guestEmail: '', guestNotes: '' });
  formErrorsAtom.set({});
}, 'clearForm');

// Combined action to create booking with form validation
export const submitBookingForm = action(async () => {
  const formData = bookingFormAtom();
  const slot = selectedSlotAtom();
  const eventType = selectedEventTypeAtom();

  // Validate form
  const validation = validateBookingForm(formData);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.issues.forEach((err) => {
      const field = err.path[0]?.toString() ?? 'unknown';
      errors[field] = err.message;
    });
    setFormErrors(errors);
    throw new Error('Validation failed');
  }

  // Check prerequisites
  if (!slot || !eventType) {
    throw new Error('Please select an event type and time slot');
  }

  try {
    const booking = await wrap(createBookingEntity({
      eventTypeId: eventType.id,
      slotId: slot.id,
      guestName: formData.guestName!,
      guestEmail: formData.guestEmail!,
      guestNotes: formData.guestNotes,
    }));

    // Clear form after successful submission
    clearForm();

    return booking;
  } catch (error) {
    // Error is already handled in createBooking entity
    throw error;
  }
}, 'submitBookingForm').extend(withAsync());
