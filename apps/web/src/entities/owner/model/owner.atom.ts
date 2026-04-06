import { atom } from '@reatom/core';
import { reatomAsync } from '@reatom/async';
import { Owner } from './owner.types';

// Note: Owner API doesn't exist in the generated client yet
// We'll use a direct fetch for now

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Atom to store owner information
export const ownerAtom = atom<Owner | null>(null, 'owner');

// Async action to fetch owner profile
export const fetchOwner = reatomAsync(
  async (ctx) => {
    const response = await fetch(`${API_URL}/owner/profile`);
    if (!response.ok) {
      throw new Error('Failed to fetch owner');
    }
    const owner = await response.json();
    ownerAtom(ctx, owner);
    return owner;
  },
  'fetchOwner'
);
