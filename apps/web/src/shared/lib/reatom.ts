// Reatom utility helpers
import { atom } from '@reatom/core';

// Helper to create a computed atom
export const computedAtom = <T, R>(
  sourceAtom: ReturnType<typeof atom<T>>,
  compute: (value: T) => R,
  name?: string
) => {
  return atom<R>(compute(sourceAtom()), name || 'computed');
};
