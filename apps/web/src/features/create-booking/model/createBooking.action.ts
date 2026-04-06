import { reatomAsync } from '@reatom/async';
import { createBooking as createBookingEntity } from '@entities/booking';
import { selectedSlotAtom } from '@entities/slot';
import { selectedEventTypeAtom } from '@entities/event-type';
import { bookingFormAtom, formErrorsAtom, setSubmitting, clearForm } from './bookingForm.atom';
import { validateBookingForm } from './validation';

// Combined action to create booking with form validation
export const submitBookingForm = reatomAsync(
  async (ctx) => {
    const formData = bookingFormAtom(ctx);
    const slot = selectedSlotAtom(ctx);
    const eventType = selectedEventTypeAtom(ctx);

    // Validate form
    const validation = validateBookingForm(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      formErrorsAtom(ctx, errors);
      throw new Error('Validation failed');
    }

    // Check prerequisites
    if (!slot || !eventType) {
      throw new Error('Please select an event type and time slot');
    }

    setSubmitting(ctx, true);

    try {
      const booking = await createBookingEntity(ctx, {
        eventTypeId: eventType.id,
        slotId: slot.id,
        guestName: formData.guestName!,
        guestEmail: formData.guestEmail!,
        guestNotes: formData.guestNotes,
      });

      // Clear form after successful submission
      clearForm(ctx);

      return booking;
    } finally {
      setSubmitting(ctx, false);
    }
  },
  'submitBookingForm'
);
