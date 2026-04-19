import { wrap, atom, reatomForm } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { z } from 'zod/v4';
import { apiClient, slotsApiClient } from '@shared/api';
import { eventTypeRoute } from '@pages/event-type/model/eventTypeRoute';
import { bookCatalogRoute } from '@pages/book-catalog';
import { bookingRoute } from '@pages/booking';
import { bookingFormSchema } from '@features/create-booking';
import { BookingConfirmationPage } from '../BookingConfirmationPage';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';
import type { Slot } from '@entities/slot';
import type { BookingFormData } from '@features/create-booking';
import type { Booking } from '@entities/booking';

interface LoaderData {
  eventType: EventType;
  slot: Slot;
  owner: Owner;
  form: ReturnType<typeof createBookingForm>;
}

export function createBookingForm(
  eventType: EventType,
  slot: Slot,
  navigateFn: (id: string) => void
) {
  const wasSubmitted = atom(false, 'bookingConfirmationForm.wasSubmitted');

  const form = reatomForm(
    {
      guestName: '',
      guestEmail: '',
      guestNotes: '',
    },
    {
      name: 'bookingConfirmationForm',
      schema: bookingFormSchema,
      validateOnChange: true,
      onSubmit: async (values: BookingFormData): Promise<Booking> => {
        const response = await wrap(
          apiClient.createBooking({
            eventTypeId: eventType.id,
            slotId: slot.id,
            guestName: values.guestName,
            guestEmail: values.guestEmail,
            guestNotes: values.guestNotes,
          })
        );

        if (response.status >= 400) {
          const errorData = response.data;
          const message = typeof errorData === 'object' && errorData !== null && 'message' in errorData
            ? String(errorData.message)
            : 'Failed to create booking';
          throw new Error(message);
        }

        const booking = response.data;
        navigateFn(booking.id);
        return booking;
      },
    }
  );

  return { form, wasSubmitted };
}

/**
 * Маршрут страницы подтверждения бронирования.
 * Путь: /bookings/new/:eventTypeId/confirm?slotId=
 */
export const bookingConfirmationRoute = eventTypeRoute.reatomRoute({
  path: 'confirm',

  search: z.object({ slotId: z.string() }),

  async loader({ eventTypeId, slotId }: { eventTypeId: string; slotId: string }): Promise<LoaderData | null> {
    const { navigate } = await import('@app/router');

    const slotResponse = await wrap(slotsApiClient.getSlot(slotId));
    if (slotResponse.status >= 400) {
      navigate.eventType(eventTypeId);
      return null;
    }
    const slot = slotResponse.data as Slot;

    const eventTypes = bookCatalogRoute.loader.data() ?? [];
    const eventType = eventTypes.find((et) => et.id === eventTypeId);
    if (!eventType) {
      navigate.eventType(eventTypeId);
      return null;
    }

    const owner = bookingRoute.loader.data() as Owner | undefined;
    if (!owner) {
      navigate.booking();
      return null;
    }

    const form = createBookingForm(eventType, slot, navigate.bookingDetail);

    return { eventType, slot, owner, form };
  },

  render(self): RouteChild {
    const { isPending, data } = self.loader.status();
    const error = self.loader.error();

    if (isPending) {
      return <BookingConfirmationPage isLoading={true} />;
    }

    if (error) {
      return (
        <BookingConfirmationPage isLoading={false} error={error.message} />
      );
    }

    if (!data) {
      return (
        <BookingConfirmationPage
          isLoading={false}
          error="Данные бронирования не найдены"
        />
      );
    }

    return (
      <BookingConfirmationPage
        eventType={data.eventType}
        slot={data.slot}
        owner={data.owner}
        form={data.form}
        isLoading={false}
      />
    );
  },
});

export { BookingConfirmationPage } from '../BookingConfirmationPage';
