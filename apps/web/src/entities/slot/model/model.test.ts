import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
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
  beforeEach(() => {
    context.reset();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('availableSlotsAtom должен иметь начальное значение - пустой массив', () => {
      expect(peek(availableSlotsAtom)).toEqual([]);
    });

    it('selectedSlotAtom должен иметь начальное значение - null', () => {
      expect(peek(selectedSlotAtom)).toBeNull();
    });

    it('slotsDateRangeAtom должен иметь начальное значение - null', () => {
      expect(peek(slotsDateRangeAtom)).toBeNull();
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

      availableSlotsAtom.set(mockSlots);

      expect(peek(availableSlotsAtom)).toEqual(mockSlots);
    });

    it('selectedSlotAtom должен обновляться при установке значения', () => {
      const mockSlot: Slot = {
        id: '1',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        isAvailable: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      selectedSlotAtom.set(mockSlot);

      expect(peek(selectedSlotAtom)).toEqual(mockSlot);
    });

    it('slotsDateRangeAtom должен обновляться при установке значения', () => {
      const dateRange = { startDate: '2024-01-15', endDate: '2024-01-21' };

      slotsDateRangeAtom.set(dateRange);

      expect(peek(slotsDateRangeAtom)).toEqual(dateRange);
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

      const result = await fetchAvailableSlots({
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
      expect(peek(availableSlotsAtom)).toEqual(mockSlots);
    });

    it('должен устанавливать диапазон дат в atoms', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      await fetchAvailableSlots({
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(peek(slotsDateRangeAtom)).toEqual({
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });
    });

    it('должен обрабатывать пустой ответ', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      const result = await fetchAvailableSlots({
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(result).toEqual([]);
      expect(peek(availableSlotsAtom)).toEqual([]);
    });

    it('должен обрабатывать ошибку API', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(
        fetchAvailableSlots({
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

      selectSlot(mockSlot);

      expect(peek(selectedSlotAtom)).toEqual(mockSlot);
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

      selectedSlotAtom.set(mockSlot);
      expect(peek(selectedSlotAtom)).toEqual(mockSlot);

      clearSelectedSlot();

      expect(peek(selectedSlotAtom)).toBeNull();
    });

    it('должен работать когда слот не выбран', () => {
      expect(peek(selectedSlotAtom)).toBeNull();

      clearSelectedSlot();

      expect(peek(selectedSlotAtom)).toBeNull();
    });
  });

  describe('isFetchingSlots', () => {
    it('должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.getAvailableSlotsForEventType).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      expect(peek(isFetchingSlots)).toBe(false);

      const promise = fetchAvailableSlots({
        eventTypeId: 'event-1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(peek(isFetchingSlots)).toBe(true);

      await promise;

      expect(peek(isFetchingSlots)).toBe(false);
    });
  });
});
