import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import {
  calendarViewDateAtom,
  selectedDateAtom,
  selectDate,
  changeCalendarView,
  calendarLoadingAtom,
} from './model';

// Мок для entities/slot — нужно имитировать структуру Reatom action с .pending
vi.mock('@entities/slot', () => ({
  fetchAvailableSlots: Object.assign(vi.fn().mockResolvedValue([]), {
    pending: vi.fn().mockReturnValue(0),
  }),
}));

describe('features/view-slots/model', () => {
  beforeEach(() => {
    context.reset();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('calendarViewDateAtom должен иметь начальное значение - текущая дата', () => {
      const value = peek(calendarViewDateAtom);
      const now = new Date();

      expect(value.getDate()).toBe(now.getDate());
      expect(value.getMonth()).toBe(now.getMonth());
      expect(value.getFullYear()).toBe(now.getFullYear());
    });

    it('selectedDateAtom должен иметь начальное значение - null', () => {
      expect(peek(selectedDateAtom)).toBeNull();
    });
  });

  describe('changeCalendarView', () => {
    it('должен изменять дату просмотра календаря', () => {
      const newDate = new Date('2024-06-15');

      changeCalendarView(newDate);

      expect(peek(calendarViewDateAtom)).toEqual(newDate);
    });

    it('должен работать с разными датами', () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        new Date('2023-06-15'),
      ];

      dates.forEach((date) => {
        changeCalendarView(date);
        expect(peek(calendarViewDateAtom)).toEqual(date);
      });
    });
  });

  describe('selectDate', () => {
    it('должен устанавливать выбранную дату', async () => {
      const date = new Date('2024-01-15');

      await selectDate(date, 'event-1');

      expect(peek(selectedDateAtom)).toEqual(date);
    });

    it('должен загружать слоты для выбранной даты', async () => {
      const date = new Date('2024-01-15');

      await selectDate(date, 'event-1');

      const { fetchAvailableSlots } = await import('@entities/slot');
      expect(fetchAvailableSlots).toHaveBeenCalled();
    });

    it('должен вычислять правильный диапазон недели', async () => {
      // Воскресенье 14 января 2024
      const sunday = new Date('2024-01-14');

      await selectDate(sunday, 'event-1');

      const { fetchAvailableSlots } = await import('@entities/slot');
      const callArgs = vi.mocked(fetchAvailableSlots).mock.calls[0][0];

      expect(callArgs.startDate).toBeDefined();
      expect(callArgs.endDate).toBeDefined();
      expect(callArgs.eventTypeId).toBe('event-1');
    });
  });

  describe('calendarLoadingAtom', () => {
    it('должен отражать состояние загрузки', () => {
      const value = peek(calendarLoadingAtom);
      expect(typeof value).toBe('boolean');
    });
  });
});
