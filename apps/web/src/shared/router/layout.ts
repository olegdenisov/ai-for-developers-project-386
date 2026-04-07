import { reatomRoute } from '@reatom/core';
import type { RouteChild } from '@reatom/core';

/**
 * Корневой layout-маршрут приложения
 * Все остальные маршруты являются вложенными (nested)
 * Рендерит outlet для отображения активных дочерних маршрутов
 */
export const layoutRoute = reatomRoute({
  layout: true,
  render({ outlet }: { outlet: () => RouteChild[] }) {
    const children = outlet();
    // Берем последний элемент массива - текущий активный роут
    // outlet() возвращает массив всех совпавших дочерних роутов
    const currentRoute = children.at(-1);
    return currentRoute ?? null;
  },
});

export type LayoutRoute = typeof layoutRoute;
