import type { Slot } from '@entities/slot';

// Форматирование длительности (например: "15 мин" или "1 ч 30 мин")
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

// Подсчет количества доступных слотов на конкретную дату
export function countAvailableSlotsForDate(slots: Slot[], date: Date): number {
  return slots.filter((slot) => {
    const slotDate = new Date(slot.startTime);
    return (
      slotDate.getDate() === date.getDate() &&
      slotDate.getMonth() === date.getMonth() &&
      slotDate.getFullYear() === date.getFullYear() &&
      slot.isAvailable
    );
  }).length;
}

// Получение слотов на конкретную дату
export function getSlotsForDate(slots: Slot[], date: Date): Slot[] {
  return slots.filter((slot) => {
    const slotDate = new Date(slot.startTime);
    return (
      slotDate.getDate() === date.getDate() &&
      slotDate.getMonth() === date.getMonth() &&
      slotDate.getFullYear() === date.getFullYear()
    );
  });
}
