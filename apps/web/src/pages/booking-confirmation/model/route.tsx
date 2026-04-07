import { wrap } from '@reatom/core';
// @ts-ignore - reatomForm доступен в runtime, но не объявлен в типах
import { reatomForm } from '@reatom/core';
import { z } from 'zod/v4';
import { apiClient } from '@shared/api';
import { bookCatalogRoute } from '@pages/book-catalog';
import { bookingEventTypeAtom, bookingSlotAtom } from '@features/create-booking';
import { bookingFormSchema } from '@features/create-booking';
import { BookingConfirmationPage } from '../BookingConfirmationPage';
import type { EventType } from '@entities/event-type';
import type { Owner } from '@entities/owner';
import type { Slot } from '@entities/slot';
import type { BookingFormData } from '@features/create-booking';
import type { Booking } from '@entities/booking';

/**
 * Тип для данных, возвращаемых loader
 */
interface LoaderData {
  eventType: EventType;
  slot: Slot;
  owner: Owner;
  form: ReturnType<typeof createBookingForm>;
}

/**
 * Factory function для создания формы бронирования
 * Создается внутри route loader для автоматической очистки
 */
export function createBookingForm(
  eventType: EventType,
  slot: Slot,
  navigateFn: (id: string) => void
) {
  return reatomForm(
    {
      guestName: '',
      guestEmail: '',
      guestNotes: '',
    } as BookingFormData,
    {
      name: 'bookingConfirmationForm',
      schema: bookingFormSchema,
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
          const errorData = response.data as { message?: string };
          throw new Error(errorData.message || 'Failed to create booking');
        }

        const booking = response.data as Booking;

        // Очищаем контекст бронирования
        bookingEventTypeAtom.set(null);
        bookingSlotAtom.set(null);

        // Переходим на страницу деталей бронирования
        navigateFn(booking.id);

        return booking;
      },
    }
  );
}

/**
 * Маршрут страницы подтверждения бронирования
 * Использует factory pattern: создает форму внутри loader
 * Путь: /bookings/new/confirm
 */
export const bookingConfirmationRoute = bookCatalogRoute.reatomRoute({
  path: 'confirm',

  /**
   * Валидация параметров URL
   */
  params: z.object({}),

  /**
   * Loader с factory pattern:
   * - Проверяет наличие контекста бронирования
   * - Создает форму через factory function
   */
  async loader(): Promise<LoaderData | null> {
    const eventType = bookingEventTypeAtom();
    const slot = bookingSlotAtom();

    // Guard: если нет данных, редиректим на каталог
    if (!eventType || !slot) {
      // Импортируем navigate динамически для избежания циклических зависимостей
      const { navigate } = await import('@app/router');
      navigate.booking();
      return null;
    }

    // Используем fallback значение для владельца
    // (в текущей версии API нет метода getOwnerProfile)
    const owner: Owner = {
      id: 'default',
      name: 'Host',
      email: '',
      isPredefined: true,
      createdAt: '',
    };

    // Factory: создаем форму внутри loader
    // Импортируем navigate динамически
    const { navigate } = await import('@app/router');
    const form = createBookingForm(eventType, slot, navigate.bookingDetail);

    return { eventType, slot, owner, form };
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
