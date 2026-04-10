import type { RouteChild } from '@reatom/core';
import { layoutRoute } from '@shared/router';
import { HomePage } from '../HomePage';

// ============================================
// HOME ROUTE
// ============================================

/**
 * Home route - главная страница
 * Путь: '/' (корневой путь)
 * Page route - рендерится только при exact match
 */
export const homeRoute = layoutRoute.reatomRoute({
  path: '',

  render(): RouteChild {
    return <HomePage />;
  },
});

// ============================================
// EXPORTS
// ============================================

export { HomePage } from '../HomePage';
