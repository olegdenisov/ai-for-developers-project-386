import { context, peek } from '@reatom/core';

/**
 * Сбрасывает глобальный контекст Reatom между тестами.
 * Вызывать в beforeEach.
 */
export function resetReatomContext(): void {
  context.reset();
}

/**
 * Читает текущее значение атома без реактивной подписки.
 */
export { peek };
