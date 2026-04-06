import { atom } from '@reatom/core';
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

// Form submission state
export const isSubmittingAtom = atom(false, 'isSubmitting');

// Actions to update form fields
export const updateFormField = (
  ctx: any,
  field: keyof BookingFormData,
  value: string
) => {
  const current = bookingFormAtom(ctx);
  bookingFormAtom(ctx, { ...current, [field]: value });
  
  // Clear error for this field when user types
  const currentErrors = formErrorsAtom(ctx);
  if (currentErrors[field]) {
    formErrorsAtom(ctx, { ...currentErrors, [field]: undefined });
  }
};

export const setFormErrors = (
  ctx: any,
  errors: Partial<Record<keyof BookingFormData, string>>
) => {
  formErrorsAtom(ctx, errors);
};

export const clearForm = (ctx: any) => {
  bookingFormAtom(ctx, { guestName: '', guestEmail: '', guestNotes: '' });
  formErrorsAtom(ctx, {});
};

export const setSubmitting = (ctx: any, value: boolean) => {
  isSubmittingAtom(ctx, value);
};
