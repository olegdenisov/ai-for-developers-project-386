import { atom, action } from '@reatom/core';
import { BookingFormData } from './validation';

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
