import { action } from '@reatom/core';
import { selectedEventTypeIdAtom, updateUrlParam, selectedDateAtom, selectedSlotIdAtom, selectedSlotAtom } from '@pages/event-type/model/route';

/**
 * Action для выбора типа события из каталога.
 * Устанавливает selectedEventTypeIdAtom и синхронизирует URL.
 * Не выполняет навигацию — страница перерендеривается реактивно.
 */
export const handleEventTypeClick = action((eventTypeId: string) => {
  // Сбрасываем предыдущий выбор
  selectedDateAtom.set(null);
  selectedSlotAtom.set(null);
  selectedSlotIdAtom.set(null);
  // Устанавливаем выбранный тип события
  selectedEventTypeIdAtom.set(eventTypeId);
  // Синхронизируем URL
  updateUrlParam('eventTypeId', eventTypeId);
  updateUrlParam('date', null);
  updateUrlParam('slotId', null);
}, 'handleEventTypeClick');
