import { atom, action, withAsync, computed, wrap } from '@reatom/core';
import { apiClient } from '@shared/api';
import { Owner } from './types';

// Atom to store owner information
export const ownerAtom = atom<Owner | null>(null, 'owner');

// Async action to fetch owner profile
export const fetchOwner = action(async () => {
  const response = await wrap(apiClient.ownerApi.getProfile());
  if (response.status >= 400) {
    throw new Error('Failed to fetch owner');
  }
  const owner = response.data;
  ownerAtom.set(owner);
  return owner;
}, 'fetchOwner').extend(withAsync());

// Computed: check if fetching owner
export const isFetchingOwner = computed(() => {
  return fetchOwner.pending() > 0;
}, 'isFetchingOwner');
