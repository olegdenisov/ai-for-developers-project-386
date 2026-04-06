import { atom, action, wrap, withAsync, computed } from '@reatom/core';
import { Owner } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Atom to store owner information
export const ownerAtom = atom<Owner | null>(null, 'owner');

// Async action to fetch owner profile
export const fetchOwner = action(async () => {
  const response = await wrap(fetch(`${API_URL}/owner/profile`));
  if (!response.ok) {
    throw new Error('Failed to fetch owner');
  }
  const owner = await wrap(response.json());
  ownerAtom.set(owner);
  return owner;
}, 'fetchOwner').extend(withAsync());

// Computed: check if fetching owner
export const isFetchingOwner = computed(() => {
  return fetchOwner.pending();
}, 'isFetchingOwner');
