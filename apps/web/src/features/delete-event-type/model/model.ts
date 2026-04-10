import { action, atom, withAsync, wrap } from '@reatom/core';
import { eventTypesApiClient } from '@shared/api';
import type { EventType } from '@entities/event-type';

// ============================================
// СОСТОЯНИЕ УДАЛЕНИЯ ТИПА СОБЫТИЯ
// ============================================

/** Тип события, которое ожидает подтверждения удаления (null — модалка закрыта) */
export const deletingEventType = atom<EventType | null>(null, 'deleteEventType.deleting');

// ============================================
// ДЕЙСТВИЯ
// ============================================

/**
 * Открыть модалку подтверждения удаления
 */
export const openDeleteEventType = action((et: EventType) => {
  deletingEventType.set(et);
}, 'deleteEventType.open');

/**
 * Закрыть модалку без удаления
 */
export const closeDeleteEventType = action(() => {
  deletingEventType.set(null);
}, 'deleteEventType.close');

/**
 * Подтвердить удаление текущего типа события
 */
export const confirmDeleteEventType = action(async (onSuccess: () => void) => {
  const et = deletingEventType();
  if (!et) return;

  const response = await wrap(eventTypesApiClient.deleteEventType(et.id));
  if (response.status >= 400) {
    throw new Error('Не удалось удалить тип события');
  }

  deletingEventType.set(null);
  onSuccess();
}, 'deleteEventType.confirm').extend(withAsync());
