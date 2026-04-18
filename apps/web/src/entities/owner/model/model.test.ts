import { describe, it, expect, beforeEach, vi } from 'vitest';
import { context, peek } from '@reatom/core';
import { ownerAtom, fetchOwner, isFetchingOwner } from './model';
import type { Owner } from './types';

const mockOwnerData: Owner = {
  id: 'test-owner-id',
  name: 'Test Host',
  email: 'host@test.com',
  isPredefined: true,
  createdAt: '2024-01-01T00:00:00Z',
};

vi.mock('@shared/api', () => ({
  ownerApiClient: {
    getProfile: vi.fn().mockResolvedValue({
      status: 200,
      data: {
        id: 'test-owner-id',
        name: 'Test Host',
        email: 'host@test.com',
        isPredefined: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    }),
  },
}));

describe('entities/owner/model', () => {
  beforeEach(() => {
    context.reset();
  });

  describe('atoms', () => {
    it('ownerAtom должен иметь начальное значение - null', () => {
      expect(peek(ownerAtom)).toBeNull();
    });

    it('ownerAtom должен обновляться при установке значения', () => {
      const owner: Owner = {
        id: 'owner-1',
        name: 'Host',
        email: 'host@example.com',
        isPredefined: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      ownerAtom.set(owner);
      expect(peek(ownerAtom)).toEqual(owner);
    });
  });

  describe('fetchOwner', () => {
    it('должен возвращать данные владельца из API', async () => {
      const result = await fetchOwner();

      expect(result).toEqual(mockOwnerData);
    });

    it('должен устанавливать данные владельца в ownerAtom', async () => {
      await fetchOwner();

      const owner = peek(ownerAtom);
      expect(owner).toEqual(mockOwnerData);
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
