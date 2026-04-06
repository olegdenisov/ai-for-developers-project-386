import { action, wrap, withAsync } from '@reatom/core';
import { createBooking as createBookingEntity } from '@entities/booking';
import { selectedSlotAtom } from '@entities/slot';
import { selectedEventTypeAtom } from '@entities/event-type';
import { bookingFormAtom, setFormErrors, clearForm } from './bookingForm.atom';
import { validateBookingForm } from './validation';

// Combined action to create booking with form validation
export const submitBookingForm = action(async () => {
  const formData = bookingFormAtom();
  const slot = selectedSlotAtom();
  const eventType = selectedEventTypeAtom();

  // Validate form
  const validation = validateBookingForm(formData);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.errors.forEach((err) => {
      const field = err.path[0] as string;
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
