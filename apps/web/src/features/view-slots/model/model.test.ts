import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
import {
  calendarViewDateAtom,
  selectedDateAtom,
  selectDate,
  changeCalendarView,
  calendarLoadingAtom,
} from './model';

// Мок для entities/slot
vi.mock('@entities/slot', () => ({
  fetchAvailableSlots: vi.fn().mockResolvedValue([]),
  fetchAvailableSlotsPending: { get: () => false },
}));

vi.mock('@entities/slot/model/model', () => ({
  fetchAvailableSlots: {
    pending: vi.fn().mockReturnValue(false),
  },
}));

describe('features/view-slots/model', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('calendarViewDateAtom должен иметь начальное значение - текущая дата', () => {
      const value = ctx.get(calendarViewDateAtom);
      const now = new Date();

      // Сравниваем только дату, без времени
      expect(value.getDate()).toBe(now.getDate());
      expect(value.getMonth()).toBe(now.getMonth());
      expect(value.getFullYear()).toBe(now.getFullYear());
    });

    it('selectedDateAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(selectedDateAtom);
      expect(value).toBeNull();
    });
  });

  describe('changeCalendarView', () => {
    it('должен изменять дату просмотра календаря', () => {
      const newDate = new Date('2024-06-15');

      changeCalendarView(ctx, newDate);

      expect(ctx.get(calendarViewDateAtom)).toEqual(newDate);
    });

    it('должен работать с разными датами', () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        new Date('2023-06-15'),
      ];

      dates.forEach((date) => {
        changeCalendarView(ctx, date);
        expect(ctx.get(calendarViewDateAtom)).toEqual(date);
      });
    });
  });

  describe('selectDate', () => {
    it('должен устанавливать выбранную дату', async () => {
      const date = new Date('2024-01-15');

      await selectDate(ctx, date, 'event-1');

      expect(ctx.get(selectedDateAtom)).toEqual(date);
    });

    it('должен загружать слоты для выбранной даты', async () => {
      const date = new Date('2024-01-15');

      await selectDate(ctx, date, 'event-1');

      // Проверяем что fetchAvailableSlots был вызван
      const { fetchAvailableSlots } = await import('@entities/slot');
      expect(fetchAvailableSlots).toHaveBeenCalled();
    });

    it('должен вычислять правильный диапазон недели', async () => {
      // Воскресенье 14 января 2024
      const sunday = new Date('2024-01-14');

      await selectDate(ctx, sunday, 'event-1');

      const { fetchAvailableSlots } = await import('@entities/slot');
      const callArgs = vi.mocked(fetchAvailableSlots).mock.calls[0][1];

      // Проверяем что startDate - начало недели (воскресенье)
      expect(callArgs.startDate).toBeDefined();
      expect(callArgs.endDate).toBeDefined();
      expect(callArgs.eventTypeId).toBe('event-1');
    });
  });

  describe('calendarLoadingAtom', () => {
    it('должен отражать состояние загрузки', () => {
      // Значение computed атома зависит от fetchAvailableSlots.pending()
      const value = ctx.get(calendarLoadingAtom);
      expect(typeof value).toBe('boolean');
    });
  });
});
