import { createTestCtx, type Ctx } from '@reatom/core';

/**
 * Создает тестовый контекст Reatom для изоляции тестов
 */
export function createReatomTestCtx(): Ctx {
  return createTestCtx();
}

/**
 * Хелпер для ожидания завершения асинхронных действий Reatom
 */
export async function waitForReatomAsync(ctx: Ctx): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Хелпер для получения текущего значения атома в тестах
 */
export function getAtomValue<T>(atom: { get: () => T }): T {
  return atom.get();
}
