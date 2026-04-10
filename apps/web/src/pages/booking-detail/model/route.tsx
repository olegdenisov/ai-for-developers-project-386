import { wrap } from '@reatom/core';
import { z } from 'zod/v4';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import { createCancelForm } from '@features/cancel-booking';
import { BookingDetailPage } from '../BookingDetailPage';
import type { Booking } from '@entities/booking';

/**
 * Тип для данных, возвращаемых loader
 */
interface LoaderData {
  booking: Booking;
  cancelForm: ReturnType<typeof createCancelForm>;
}

/**
 * Маршрут страницы деталей бронирования
 * Использует factory pattern: создает форму отмены внутри loader
 * Путь: /bookings/:id
 */
export const bookingDetailRoute = layoutRoute.reatomRoute({
  path: 'bookings/:id',

  /**
   * Валидация параметров URL
   * id не может быть "new" чтобы не конфликтовать с маршрутом /bookings/new
   */
  params: z.object({
    id: z.string().refine((val) => val !== 'new', {
      message: 'ID не может быть "new"',
    }),
  }),

  /**
   * Loader с factory pattern:
   * - Загружает данные бронирования
   * - Создает форму отмены через factory function
   */
  async loader({ id }: { id: string }): Promise<LoaderData | null> {
    // Загружаем бронирование
    const response = await wrap(apiClient.getBooking(id));

    if (response.status >= 400) {
      throw new Error('Booking not found');
    }

    const booking = response.data as Booking;

    // Factory: создаем форму отмены внутри loader
    const cancelForm = createCancelForm(id);

    return { booking, cancelForm };
  },

  /**
   * Render функция возвращает React компонент
   */
  render(self: {
    loader: {
      pending: () => boolean;
      data: () => LoaderData | null;
      error: () => Error | null;
    };
  }): React.ReactNode {
    const isPending = self.loader.pending();
    const data = self.loader.data();
    const error = self.loader.error();

    if (isPending) {
      return <BookingDetailPage isLoading={true} />;
    }

    if (error) {
      return (
        <BookingDetailPage isLoading={false} error={error.message} />
      );
    }

    if (!data) {
      return (
        <BookingDetailPage
          isLoading={false}
          error="Бронирование не найдено"
        />
      );
    }

    return (
      <BookingDetailPage
        booking={data.booking}
        cancelForm={data.cancelForm}
        isLoading={false}
      />
    );
  },
});

export { BookingDetailPage } from '../BookingDetailPage';
