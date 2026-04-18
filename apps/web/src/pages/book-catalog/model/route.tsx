import { wrap } from '@reatom/core';
import type { RouteChild } from '@reatom/core';
import { apiClient } from '@shared/api';
import { bookingRoute } from '@pages/booking';
import { BookCatalogPage } from '../BookCatalogPage';
import type { EventType } from '@entities/event-type';

/**
 * Book catalog route — каталог типов событий.
 * Путь: /bookings/new
 * Layout route — рендерит дочерний маршрут (eventTypeRoute) или сам каталог.
 */
export const bookCatalogRoute = bookingRoute.reatomRoute({
  path: 'new',
  layout: true,

  async loader(): Promise<EventType[]> {
    const response = await wrap(apiClient.listPublicEventTypes());

    if (response.status >= 400) {
      throw new Error('Failed to fetch event types');
    }

    return Array.isArray(response.data) ? response.data : [];
  },

  render(self): RouteChild {
    const children = self.outlet();

    if (children && children.length > 0) {
      return children.at(-1)!;
    }

    const { isPending, data: eventTypes } = self.loader.status();
    const error = self.loader.error();

    return (
      <BookCatalogPage
        eventTypes={eventTypes || []}
        isLoading={isPending}
        error={error?.message}
      />
    );
  },
});
