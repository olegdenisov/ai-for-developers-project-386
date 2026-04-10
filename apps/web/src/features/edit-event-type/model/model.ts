import { action, atom, wrap } from '@reatom/core';
// @ts-ignore - reatomForm доступен в runtime, но не объявлен в типах
import { reatomForm } from '@reatom/core';
import { eventTypesApiClient } from '@shared/api';
import type { EventType } from '@entities/event-type';

// ============================================
// СОСТОЯНИЕ РЕДАКТИРОВАНИЯ ТИПА СОБЫТИЯ
// ============================================

/** Тип события, которое сейчас редактируется (null — модалка закрыта) */
export const editingEventType = atom<EventType | null>(null, 'editEventType.editing');

// ============================================
// ФОРМА РЕДАКТИРОВАНИЯ
// ============================================

export const editEventTypeForm = reatomForm(
  {
    name: '',
    description: '',
    durationMinutes: 30,
  },
  {
    name: 'editEventTypeForm',
    onSubmit: async (values: { name: string; description: string; durationMinutes: number }) => {
      const et = editingEventType();
      if (!et) throw new Error('Не выбран тип события для редактирования');

      const response = await wrap(
        eventTypesApiClient.updateEventType(et.id, {
          name: values.name,
          description: values.description || undefined,
          durationMinutes: Number(values.durationMinutes),
        }),
      );
      if (response.status >= 400) {
        throw new Error('Не удалось обновить тип события');
      }
      return response.data;
    },
  },
);

// ============================================
// ДЕЙСТВИЯ
// ============================================

/**
 * Открыть модалку редактирования с предзаполненными данными
 */
export const openEditEventType = action((et: EventType) => {
  editingEventType.set(et);
  editEventTypeForm.fields.name.set(et.name);
  editEventTypeForm.fields.description.set(et.description ?? '');
  editEventTypeForm.fields.durationMinutes.set(et.durationMinutes);
}, 'editEventType.open');

/**
 * Закрыть модалку редактирования и сбросить форму
 */
export const closeEditEventType = action(() => {
  editingEventType.set(null);
  editEventTypeForm.reset();
}, 'editEventType.close');
