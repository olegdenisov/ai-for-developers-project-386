import { action } from '@reatom/core';
import { navigate } from '@app/router';

/**
 * Action для перехода к выбору слотов типа события
 */
export const handleEventTypeClick = action((eventTypeId: string) => {
  navigate.eventType(eventTypeId);
}, 'handleEventTypeClick');
