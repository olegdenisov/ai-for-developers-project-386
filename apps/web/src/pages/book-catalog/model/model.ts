import { action } from '@reatom/core';
import { navigate } from '@app/router';

/**
 * Action для выбора типа события из каталога.
 * Выполняет навигацию на страницу выбора слота.
 */
export const handleEventTypeClick = action((eventTypeId: string) => {
  navigate.eventType(eventTypeId);
}, 'handleEventTypeClick');
