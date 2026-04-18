import { wrap } from '@reatom/core';
import { createElement, Fragment } from 'react';
import { apiClient } from '@shared/api';
import { layoutRoute } from '@shared/router';
import type { Owner } from '@entities/owner';

/**
 * Общий layout-маршрут для флоу бронирования
 * Путь: '/bookings'
 * Загружает профиль хоста один раз — все вложенные маршруты получают owner через loader.data()
 */
export const bookingRoute = layoutRoute.reatomRoute({
  path: 'bookings',
  layout: true,

  async loader(): Promise<Owner> {
    const response = await wrap(apiClient.ownerApi.getProfile());
    if (response.status >= 400) {
      throw new Error('Failed to fetch owner profile');
    }
    return response.data;
  },

  render(self) {
    return self.outlet().at(-1) ?? createElement(Fragment);
  },
});
