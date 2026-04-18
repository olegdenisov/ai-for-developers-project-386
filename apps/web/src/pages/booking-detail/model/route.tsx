import { wrap } from '@reatom/core';
import { z } from 'zod/v4';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { createCancelForm } from '@features/cancel-booking';
import { createRescheduleForm } from '@features/reschedule-booking';
import { currentBookingAtom } from '@entities/booking';
import { BookingDetailPage } from '../BookingDetailPage';
import type { Booking } from '@entities/booking';

/**
 * Тип для данных, возвращаемых loader
 */
interface LoaderData {
  booking: Booking;
  cancelForm: ReturnType<typeof createCancelForm>;
  rescheduleForm: ReturnType<typeof createRescheduleForm>;
}

/**
 * Маршрут страницы деталей бронирования
 * Использует factory pattern: создает форму отмены внутри loader
 * Путь: /bookings/:id
 */
export const bookingDetailRoute = layoutRoute.reatomRoute({
  path: 'bookings/:id',

  params: z.object({
    id: z.string().refine((val) => val !== 'new', {
      message: 'ID не может быть "new"',
    }),
  }),

  async loader({ id }: { id: string }): Promise<LoaderData | null> {
    const response = await wrap(apiClient.getBooking(id));
    const booking = response.data;

    currentBookingAtom.set(booking);

    const cancelForm = createCancelForm(id);
    const rescheduleForm = createRescheduleForm(id, booking.eventTypeId);

    return { booking, cancelForm, rescheduleForm };
  },

  render(self) {
    const isPending = self.loader.pending();
    const data = self.loader.data();
    const error = self.loader.error();

    if (isPending) {
      return <BookingDetailPage isLoading={true} />;
    }

    if (error) {
      return <BookingDetailPage isLoading={false} error={error.message} />;
    }

    if (!data) {
      return <BookingDetailPage isLoading={false} error="Бронирование не найдено" />;
    }

    const liveBooking = currentBookingAtom();
    const booking = (liveBooking && liveBooking.id === data.booking.id) ? liveBooking : data.booking;

    return (
      <BookingDetailPage
        booking={booking}
        cancelForm={data.cancelForm}
        rescheduleForm={data.rescheduleForm}
        isLoading={false}
      />
    );
  },
});

export { BookingDetailPage } from '../BookingDetailPage';
