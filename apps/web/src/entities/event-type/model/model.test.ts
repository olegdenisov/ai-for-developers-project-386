import { describe, it, expect, vi, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import {
  eventTypesAtom,
  selectedEventTypeAtom,
  fetchEventTypes,
  fetchEventTypeById,
  isFetchingEventTypes,
  isFetchingEventType,
} from './model';
import type { EventType } from './types';

// Мок для API клиента
vi.mock('@shared/api', () => ({
  apiClient: {
    listPublicEventTypes: vi.fn(),
    getPublicEventType: vi.fn(),
  },
}));

import { apiClient } from '@shared/api';

describe('entities/event-type/model', () => {
  beforeEach(() => {
    context.reset();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('eventTypesAtom должен иметь начальное значение - пустой массив', () => {
      expect(peek(eventTypesAtom)).toEqual([]);
    });

    it('selectedEventTypeAtom должен иметь начальное значение - null', () => {
      expect(peek(selectedEventTypeAtom)).toBeNull();
    });

    it('eventTypesAtom должен обновляться при установке значения', () => {
      const mockEventTypes: EventType[] = [
        {
          id: '1',
          name: 'Встреча 30 мин',
          description: 'Короткая встреча',
          durationMinutes: 30,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      eventTypesAtom.set(mockEventTypes);

      expect(peek(eventTypesAtom)).toEqual(mockEventTypes);
    });

    it('selectedEventTypeAtom должен обновляться при установке значения', () => {
      const mockEventType: EventType = {
        id: '1',
        name: 'Встреча 30 мин',
        description: 'Короткая встреча',
        durationMinutes: 30,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      selectedEventTypeAtom.set(mockEventType);

      expect(peek(selectedEventTypeAtom)).toEqual(mockEventType);
    });
  });

  describe('fetchEventTypes', () => {
    it('должен загружать список типов событий успешно', async () => {
      const mockEventTypes: EventType[] = [
        {
          id: '1',
          name: 'Встреча 30 мин',
          description: 'Короткая встреча',
          durationMinutes: 30,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Консультация 60 мин',
          description: 'Длинная консультация',
          durationMinutes: 60,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: mockEventTypes,
      } as unknown as Response);

      const result = await fetchEventTypes();

      expect(result).toEqual(mockEventTypes);
      expect(peek(eventTypesAtom)).toEqual(mockEventTypes);
    });

    it('должен обрабатывать пустой ответ', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: [],
      } as unknown as Response);

      const result = await fetchEventTypes();

      expect(result).toEqual([]);
      expect(peek(eventTypesAtom)).toEqual([]);
    });

    it('должен обрабатывать ошибку API (status >= 400)', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(fetchEventTypes()).rejects.toThrow('Failed to fetch event types');
    });

    it('должен обрабатывать отсутствие eventTypes в ответе', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      const result = await fetchEventTypes();

      expect(result).toEqual([]);
      expect(peek(eventTypesAtom)).toEqual([]);
    });
  });

  describe('fetchEventTypeById', () => {
    it('должен загружать конкретный тип события по ID', async () => {
      const mockEventType: EventType = {
        id: '1',
        name: 'Встреча 30 мин',
        description: 'Короткая встреча',
        durationMinutes: 30,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 200,
        data: mockEventType,
      } as unknown as Response);

      const result = await fetchEventTypeById('1');

      expect(result).toEqual(mockEventType);
      expect(peek(selectedEventTypeAtom)).toEqual(mockEventType);
    });

    it('должен обрабатывать ошибку 404', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(fetchEventTypeById('nonexistent')).rejects.toThrow(
        'Failed to fetch event type'
      );
    });

    it('должен вызывать API с правильным ID', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      await fetchEventTypeById('123');

      expect(apiClient.getPublicEventType).toHaveBeenCalledWith('123');
    });
  });

  describe('computed states', () => {
    it('isFetchingEventTypes должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: { eventTypes: [] },
      } as unknown as Response);

      expect(peek(isFetchingEventTypes)).toBe(false);

      const promise = fetchEventTypes();
      expect(peek(isFetchingEventTypes)).toBe(true);

      await promise;
      expect(peek(isFetchingEventTypes)).toBe(false);
    });

    it('isFetchingEventType должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      expect(peek(isFetchingEventType)).toBe(false);

      const promise = fetchEventTypeById('1');
      expect(peek(isFetchingEventType)).toBe(true);

      await promise;
      expect(peek(isFetchingEventType)).toBe(false);
    });
  });
});
