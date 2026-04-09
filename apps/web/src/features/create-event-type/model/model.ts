import { atom, wrap } from '@reatom/core';
// @ts-ignore - reatomForm доступен в runtime, но не объявлен в типах
import { reatomForm } from '@reatom/core';
import { eventTypesApiClient } from '@shared/api';

// ============================================
// СОСТОЯНИЕ МОДАЛКИ СОЗДАНИЯ ТИПА СОБЫТИЯ
// ============================================

/** Флаг открытия модалки создания типа события */
export const isCreateEventTypeModalOpen = atom(false, 'createEventType.isOpen');

// ============================================
// ФОРМА СОЗДАНИЯ ТИПА СОБЫТИЯ
// ============================================

/**
 * Форма создания нового типа события.
 * onSuccess — коллбэк для обновления списка (передаётся из страницы)
 */
export const createEventTypeForm = reatomForm(
  {
    name: '',
    description: '',
    durationMinutes: 30,
  },
  {
    name: 'createEventTypeForm',
    onSubmit: async (values: { name: string; description: string; durationMinutes: number }) => {
      const response = await wrap(
        eventTypesApiClient.createEventType({
          name: values.name,
          description: values.description || undefined,
          durationMinutes: Number(values.durationMinutes),
        }),
      );
      if (response.status >= 400) {
        throw new Error('Не удалось создать тип события');
      }
      return response.data;
    },
  },
);
