import { describe, it, expect, beforeEach } from 'vitest';
import { context, peek } from '@reatom/core';
import { ownerAtom, fetchOwner, isFetchingOwner } from './model';
import type { Owner } from './types';

describe('entities/owner/model', () => {
  beforeEach(() => {
    context.reset();
  });

  describe('atoms', () => {
    it('ownerAtom должен иметь начальное значение - null', () => {
      expect(peek(ownerAtom)).toBeNull();
    });

    it('ownerAtom должен обновляться при установке значения', () => {
      const mockOwner: Owner = {
        id: 'owner-1',
        name: 'Host',
        email: 'host@example.com',
        isPredefined: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      ownerAtom.set(mockOwner);
      expect(peek(ownerAtom)).toEqual(mockOwner);
    });
  });

  describe('fetchOwner', () => {
    it('должен возвращать fallback значение для владельца', async () => {
      const result = await fetchOwner();

      expect(result).toEqual({
        id: 'default',
        name: 'Host',
        email: '',
        isPredefined: true,
        createdAt: expect.any(String),
      });
    });

    it('должен устанавливать fallback значение в ownerAtom', async () => {
      await fetchOwner();

      const owner = peek(ownerAtom);
      expect(owner).toEqual({
        id: 'default',
        name: 'Host',
        email: '',
        isPredefined: true,
        createdAt: expect.any(String),
      });
    });

    it('createdAt должен быть валидной ISO строкой даты', async () => {
      await fetchOwner();

      const owner = peek(ownerAtom);
      expect(() => new Date(owner!.createdAt)).not.toThrow();
    });
  });

  describe('isFetchingOwner', () => {
    it('должен отслеживать состояние загрузки', async () => {
      expect(peek(isFetchingOwner)).toBe(false);

      const promise = fetchOwner();
      expect(peek(isFetchingOwner)).toBe(true);

      await promise;
      expect(peek(isFetchingOwner)).toBe(false);
    });

    it('должен корректно обрабатывать множественные вызовы', async () => {
      const promise1 = fetchOwner();
      const promise2 = fetchOwner();

      expect(peek(isFetchingOwner)).toBe(true);

      await Promise.all([promise1, promise2]);

      expect(peek(isFetchingOwner)).toBe(false);
    });
  });
});
