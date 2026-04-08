import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
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
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
    vi.clearAllMocks();
  });

  describe('atoms', () => {
    it('eventTypesAtom должен иметь начальное значение - пустой массив', () => {
      const value = ctx.get(eventTypesAtom);
      expect(value).toEqual([]);
    });

    it('selectedEventTypeAtom должен иметь начальное значение - null', () => {
      const value = ctx.get(selectedEventTypeAtom);
      expect(value).toBeNull();
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

      eventTypesAtom(ctx, mockEventTypes);
      const value = ctx.get(eventTypesAtom);

      expect(value).toEqual(mockEventTypes);
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

      selectedEventTypeAtom(ctx, mockEventType);
      const value = ctx.get(selectedEventTypeAtom);

      expect(value).toEqual(mockEventType);
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
        data: { eventTypes: mockEventTypes },
      } as unknown as Response);

      const result = await fetchEventTypes(ctx);

      expect(result).toEqual(mockEventTypes);
      expect(ctx.get(eventTypesAtom)).toEqual(mockEventTypes);
    });

    it('должен обрабатывать пустой ответ', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: { eventTypes: [] },
      } as unknown as Response);

      const result = await fetchEventTypes(ctx);

      expect(result).toEqual([]);
      expect(ctx.get(eventTypesAtom)).toEqual([]);
    });

    it('должен обрабатывать ошибку API (status >= 400)', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 500,
        data: {},
      } as unknown as Response);

      await expect(fetchEventTypes(ctx)).rejects.toThrow('Failed to fetch event types');
    });

    it('должен обрабатывать отсутствие eventTypes в ответе', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      const result = await fetchEventTypes(ctx);

      expect(result).toEqual([]);
      expect(ctx.get(eventTypesAtom)).toEqual([]);
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

      const result = await fetchEventTypeById(ctx, '1');

      expect(result).toEqual(mockEventType);
      expect(ctx.get(selectedEventTypeAtom)).toEqual(mockEventType);
    });

    it('должен обрабатывать ошибку 404', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 404,
        data: {},
      } as unknown as Response);

      await expect(fetchEventTypeById(ctx, 'nonexistent')).rejects.toThrow(
        'Failed to fetch event type'
      );
    });

    it('должен вызывать API с правильным ID', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      await fetchEventTypeById(ctx, '123');

      expect(apiClient.getPublicEventType).toHaveBeenCalledWith('123');
    });
  });

  describe('computed states', () => {
    it('isFetchingEventTypes должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.listPublicEventTypes).mockResolvedValue({
        status: 200,
        data: { eventTypes: [] },
      } as unknown as Response);

      // До вызова - должен быть false
      expect(ctx.get(isFetchingEventTypes)).toBe(false);

      // Запускаем загрузку
      const promise = fetchEventTypes(ctx);

      // Во время загрузки - должен быть true
      expect(ctx.get(isFetchingEventTypes)).toBe(true);

      // Ждем завершения
      await promise;

      // После загрузки - должен быть false
      expect(ctx.get(isFetchingEventTypes)).toBe(false);
    });

    it('isFetchingEventType должен отслеживать состояние загрузки', async () => {
      vi.mocked(apiClient.getPublicEventType).mockResolvedValue({
        status: 200,
        data: {},
      } as unknown as Response);

      expect(ctx.get(isFetchingEventType)).toBe(false);

      const promise = fetchEventTypeById(ctx, '1');
      expect(ctx.get(isFetchingEventType)).toBe(true);

      await promise;

      expect(ctx.get(isFetchingEventType)).toBe(false);
    });
  });
});
