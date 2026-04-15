import { reatomRoute } from '@reatom/core';
import { createElement, Fragment } from 'react';

/**
 * Корневой layout-маршрут приложения
 * Все остальные маршруты являются вложенными (nested)
 * Рендерит outlet для отображения активных дочерних маршрутов
 */
export const layoutRoute = reatomRoute(
  {
    path: '',
    render: (self) => self.outlet().at(-1) ?? createElement(Fragment),
  },
  'layoutRoute'
);

export type LayoutRoute = typeof layoutRoute;
