import { atom, action, withAsync, computed } from '@reatom/core';
import { Owner } from './types';

// Atom to store owner information
export const ownerAtom = atom<Owner | null>(null, 'owner');

// Async action to fetch owner profile
// Примечание: метод getOwnerProfile не доступен в текущей версии API
// Используем fallback значение
export const fetchOwner = action(async () => {
  // Временное решение: возвращаем fallback значение
  // так как getOwnerProfile не доступен в API
  const fallbackOwner: Owner = {
    id: 'default',
    name: 'Host',
    email: '',
    isPredefined: true,
    createdAt: new Date().toISOString(),
  };
  ownerAtom.set(fallbackOwner);
  return fallbackOwner;
  
  /*
  // Оригинальный код (закомментирован):
  const response = await wrap(apiClient.getOwnerProfile());
  if (response.status >= 400) {
    throw new Error('Failed to fetch owner');
  }
  const owner = response.data;
  ownerAtom.set(owner);
  return owner;
  */
}, 'fetchOwner').extend(withAsync());

// Computed: check if fetching owner
export const isFetchingOwner = computed(() => {
  return fetchOwner.pending();
}, 'isFetchingOwner');
