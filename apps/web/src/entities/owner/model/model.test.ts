import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCtx } from '@reatom/core';
import { ownerAtom, fetchOwner, isFetchingOwner } from './model';
import type { Owner } from './types';

describe('entities/owner/model', () => {
  let ctx: ReturnType<typeof createTestCtx>;

  beforeEach(() => {
    ctx = createTestCtx();
  });

  describe('atoms', () => {
    it('ownerAtom должен иметь начальное значение - null', () => {
      expect(ctx.get(ownerAtom)).toBeNull();
    });

    it('ownerAtom должен обновляться при установке значения', () => {
      const mockOwner: Owner = {
        id: 'owner-1',
        name: 'Host',
        email: 'host@example.com',
        isPredefined: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      ownerAtom(ctx, mockOwner);
      expect(ctx.get(ownerAtom)).toEqual(mockOwner);
    });
  });

  describe('fetchOwner', () => {
    it('должен возвращать fallback значение для владельца', async () => {
      const result = await fetchOwner(ctx);

      // Проверяем fallback значение
      expect(result).toEqual({
        id: 'default',
        name: 'Host',
        email: '',
        isPredefined: true,
        createdAt: expect.any(String),
      });
    });

    it('должен устанавливать fallback значение в ownerAtom', async () => {
      await fetchOwner(ctx);

      const owner = ctx.get(ownerAtom);
      expect(owner).toEqual({
        id: 'default',
        name: 'Host',
        email: '',
        isPredefined: true,
        createdAt: expect.any(String),
      });
    });

    it('createdAt должен быть валидной ISO строкой даты', async () => {
      await fetchOwner(ctx);

      const owner = ctx.get(ownerAtom);
      expect(() => new Date(owner!.createdAt)).not.toThrow();
    });
  });

  describe('isFetchingOwner', () => {
    it('должен отслеживать состояние загрузки', async () => {
      expect(ctx.get(isFetchingOwner)).toBe(false);

      const promise = fetchOwner(ctx);

      // Во время выполнения должен быть true
      expect(ctx.get(isFetchingOwner)).toBe(true);

      await promise;

      // После завершения должен быть false
      expect(ctx.get(isFetchingOwner)).toBe(false);
    });

    it('должен корректно обрабатывать множественные вызовы', async () => {
      const promise1 = fetchOwner(ctx);
      const promise2 = fetchOwner(ctx);

      // Проверяем что pending корректно отслеживается
      expect(ctx.get(isFetchingOwner)).toBe(true);

      await Promise.all([promise1, promise2]);

      expect(ctx.get(isFetchingOwner)).toBe(false);
    });
  });
});
