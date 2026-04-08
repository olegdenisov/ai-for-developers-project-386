import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
import {
  availableSlotsAtom,
  selectedSlotAtom,
  slotsDateRangeAtom,
  fetchAvailableSlots,
  selectSlot,
  clearSelectedSlot,
  isFetchingSlots,
} from './model';
import type { Slot } from './types';

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    getAvailableSlotsForEventType: vi.fn(),
  },
}));

import { apiClient } from '@shared/api';

describe('entities/slot/model', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('availableSlotsAtom должен иметь начальное значение - пустой массив', () => {
      const value = ctx.get(availableSlotsAtom);
      expect(value).toEqual([]);
    });

    it('selectedSlotAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(selectedSlotAtom);
      expect(value).toBeNull();
    });

    it('slotsDateRangeAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(slotsDateRangeAtom);
      expect(value).toBeNull();
    });

    it('availableSlotsAtom должен обновляться при установке значения', () => {
      const mockSlots: Slot[] = [
        {
          id: '1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:30:00Z',
          isAvailable: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      availableSlotsAtom(ctx, mockSlots);
      const value = ctx.get(availableSlotsAtom);

      expect(value).toEqual(mockSlots);
    });

    it('selectedSlotAtom должен обновляться при установке значения', () => {
      const mockSlot: Slot = {
        id: '1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        isAvailable: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      selectedSlotAtom(ctx, mockSlot);
      const value = ctx.get(selectedSlotAtom);

      expect(value).toEqual(mockSlot);
    });

    it('slotsDateRangeAtom должен обновляться при установке значения', () => {
      const dateRange = { startDate: '2024-01-15', endDate: '2024-01-21' };

      slotsDateRangeAtom(ctx, dateRange);
      const value = ctx.get(slotsDateRangeAtom);

      expect(value).toEqual(dateRange);
    });
  });

  describe('fetchAvailableSlots', () => {
    it('должен загружать доступные слоты с правильными параметрами', async () => {
      const mockSlots: Slot[] = [
        {
          id: '1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:30:00Z',
          isAvailable: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          startTime: '2024-01-15T11:00:00Z',
          endTime: '2024-01-15T11:30:00Z',
          isAvailable: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: mockSlots,
      } as unknown as Response);

      const result = await fetchAvailableSlots(ctx, {
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(apiClient.getAvailableSlotsForEventType).toHaveBeenCalledWith(
        'event-1',
        '2024-01-15',
        '2024-01-21'
      );
      expect(result).toEqual(mockSlots);
      expect(ctx.get(availableSlotsAtom)).toEqual(mockSlots);
    });

    it('должен устанавливать диапазон дат в atoms', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      await fetchAvailableSlots(ctx, {
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(ctx.get(slotsDateRangeAtom)).toEqual({
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });
    });

    it('должен обрабатывать пустой ответ', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      const result = await fetchAvailableSlots(ctx, {
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(result).toEqual([]);
      expect(ctx.get(availableSlotsAtom)).toEqual([]);
    });

    it('должен обрабатывать ошибку API', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(
        fetchAvailableSlots(ctx, {
          eventTypeId: 'event-1',
          startDate: '2024-01-15',
          endDate: '2024-01-21',
        })
      ).rejects.toThrow('Failed to fetch available slots');
    });
  });

  describe('selectSlot', () => {
    it('должен выбирать слот', () => {
      const mockSlot: Slot = {
        id: '1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        isAvailable: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      selectSlot(ctx, mockSlot);

      expect(ctx.get(selectedSlotAtom)).toEqual(mockSlot);
    });
  });

  describe('clearSelectedSlot', () => {
    it('должен очищать выбранный слот', () => {
      const mockSlot: Slot = {
        id: '1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        isAvailable: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      selectedSlotAtom(ctx, mockSlot);
      expect(ctx.get(selectedSlotAtom)).toEqual(mockSlot);

      clearSelectedSlot(ctx);

      expect(ctx.get(selectedSlotAtom)).toBeNull();
    });

    it('должен работать когда слот не выбран', () => {
      expect(ctx.get(selectedSlotAtom)).toBeNull();

      clearSelectedSlot(ctx);

      expect(ctx.get(selectedSlotAtom)).toBeNull();
    });
  });

  describe('isFetchingSlots', () => {
    it('должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      expect(ctx.get(isFetchingSlots)).toBe(false);

      const promise = fetchAvailableSlots(ctx, {
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(ctx.get(isFetchingSlots)).toBe(true);

      await promise;

      expect(ctx.get(isFetchingSlots)).toBe(false);
    });
  });
});
