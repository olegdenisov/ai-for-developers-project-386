import { reatomRoute } from '@reatom/core';
import type { RouteChild } from '@reatom/core';

/**
 * Корневой layout-маршрут приложения
 * Все остальные маршруты являются вложенными (nested)
 * Рендерит outlet для отображения активных дочерних маршрутов
 */
export const layoutRoute = reatomRoute({
  layout: true,
  render({ outlet }: { outlet: () => RouteChild }) {
    return outlet();
  },
});

export type LayoutRoute = typeof layoutRoute;
