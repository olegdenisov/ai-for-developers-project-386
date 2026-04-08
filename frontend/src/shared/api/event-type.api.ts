import { apiClient } from './client.js';
import { EventType } from '../../entities/event-type/types.js';

export const eventTypeApi = {
  getAll: () => apiClient.get<EventType[]>('/event-types'),
  getById: (id: string) => apiClient.get<EventType>(`/event-types/${id}`),
  create: (data: Omit<EventType, 'id' | 'createdAt'>) =>
    apiClient.post<EventType>('/event-types', data),
  update: (id: string, data: Partial<EventType>) =>
    apiClient.put<EventType>(`/event-types/${id}`, data),
  delete: (id: string) => apiClient.delete(`/event-types/${id}`),
};