/**
 * API Client для Calendar Booking System
 * Сгенерирован на основе OpenAPI спецификации
 * Использует fetch API с типами из @calendar-booking/shared-types
 */

import type { paths, components } from '@calendar-booking/shared-types';

// Re-export типы для удобства
export type {
  components,
  paths,
};

// Типы для ответов API
export type ApiResponse<T> = {
  data: T;
  headers?: Record<string, string>;
  status: number;
};

export type ApiError = {
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
};

/**
 * Базовый класс для API клиента
 */
class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  protected async fetch<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T; headers: Headers; status: number }> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(JSON.stringify(error));
    }

    const data = response.status === 204 ? null : await response.json();
    return { data, headers: response.headers, status: response.status };
  }
}

/**
 * Public API для гостей
 */
export class PublicApi extends BaseApiClient {
  /**
   * Получить список доступных типов событий
   */
  async listPublicEventTypes(): Promise<
    ApiResponse<components['schemas']['EventType'][]>
  > {
    const response = await this.fetch<components['schemas']['EventType'][]>(
      '/public/event-types'
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить тип события по ID
   */
  async getPublicEventType(id: string): Promise<
    ApiResponse<components['schemas']['EventType']>
  > {
    const response = await this.fetch<components['schemas']['EventType']>(
      `/public/event-types/${id}`
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить доступные слоты для типа события
   */
  async getAvailableSlotsForEventType(
    eventTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<components['schemas']['Slot'][]>> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.fetch<components['schemas']['Slot'][]>(
      `/public/event-types/${eventTypeId}/slots?${params}`
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Создать бронирование
   */
  async createBooking(
    data: components['schemas']['CreateBookingRequest']
  ): Promise<ApiResponse<components['schemas']['Booking']>> {
    const response = await this.fetch<components['schemas']['Booking']>(
      '/public/bookings',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить бронирование по ID
   */
  async getBooking(id: string): Promise<
    ApiResponse<components['schemas']['Booking']>
  > {
    const response = await this.fetch<components['schemas']['Booking']>(
      `/public/bookings/${id}`
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Отменить бронирование
   */
  async cancelBooking(
    id: string,
    reason?: string
  ): Promise<ApiResponse<components['schemas']['Booking']>> {
    const response = await this.fetch<components['schemas']['Booking']>(
      `/public/bookings/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return { data: response.data, status: response.status };
  }
}

/**
 * Owner API для владельца календаря
 */
export class OwnerApi extends BaseApiClient {
  /**
   * Получить профиль владельца
   */
  async getProfile(): Promise<
    ApiResponse<components['schemas']['Owner']>
  > {
    const response = await this.fetch<components['schemas']['Owner']>(
      '/owner/profile'
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить список предстоящих бронирований
   */
  async getUpcomingBookings(params?: {
    status?: components['schemas']['BookingStatus'];
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<components['schemas']['Booking'][]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));

    const query = queryParams.toString();
    const response = await this.fetch<components['schemas']['Booking'][]>(
      `/owner/bookings${query ? `?${query}` : ''}`
    );
    
    const totalCount = response.headers.get('X-Total-Count');
    return { 
      data: response.data, 
      status: response.status,
      headers: totalCount ? { 'X-Total-Count': totalCount } : undefined,
    };
  }
}

/**
 * Event Types API
 */
export class EventTypesApi extends BaseApiClient {
  /**
   * Получить список всех типов событий
   */
  async listEventTypes(): Promise<
    ApiResponse<components['schemas']['EventType'][]>
  > {
    const response = await this.fetch<components['schemas']['EventType'][]>(
      '/event-types'
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить тип события по ID
   */
  async getEventType(id: string): Promise<
    ApiResponse<components['schemas']['EventType']>
  > {
    const response = await this.fetch<components['schemas']['EventType']>(
      `/event-types/${id}`
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Создать новый тип события
   */
  async createEventType(
    data: components['schemas']['CreateEventTypeRequest']
  ): Promise<ApiResponse<components['schemas']['EventType']>> {
    const response = await this.fetch<components['schemas']['EventType']>(
      '/event-types',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Обновить тип события
   */
  async updateEventType(
    id: string,
    data: components['schemas']['UpdateEventTypeRequest']
  ): Promise<ApiResponse<components['schemas']['EventType']>> {
    const response = await this.fetch<components['schemas']['EventType']>(
      `/event-types/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Удалить тип события
   */
  async deleteEventType(id: string): Promise<ApiResponse<void>> {
    const response = await this.fetch<void>(`/event-types/${id}`, {
      method: 'DELETE',
    });
    return { data: undefined, status: response.status };
  }
}

/**
 * Slots API
 */
export class SlotsApi extends BaseApiClient {
  /**
   * Получить доступные слоты
   */
  async listAvailableSlots(params?: {
    eventTypeId?: string;
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<components['schemas']['Slot'][]>> {
    const queryParams = new URLSearchParams();
    if (params?.eventTypeId) queryParams.set('eventTypeId', params.eventTypeId);
    queryParams.set('startDate', params!.startDate);
    queryParams.set('endDate', params!.endDate);

    const response = await this.fetch<components['schemas']['Slot'][]>(
      `/slots?${queryParams}`
    );
    return { data: response.data, status: response.status };
  }

  /**
   * Получить слот по ID
   */
  async getSlot(id: string): Promise<
    ApiResponse<components['schemas']['Slot']>
  > {
    const response = await this.fetch<components['schemas']['Slot']>(
      `/slots/${id}`
    );
    return { data: response.data, status: response.status };
  }
}

/**
 * Единый API клиент со всеми API
 */
export class CalendarBookingApi {
  public publicApi: PublicApi;
  public ownerApi: OwnerApi;
  public eventTypesApi: EventTypesApi;
  public slotsApi: SlotsApi;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.publicApi = new PublicApi(baseUrl);
    this.ownerApi = new OwnerApi(baseUrl);
    this.eventTypesApi = new EventTypesApi(baseUrl);
    this.slotsApi = new SlotsApi(baseUrl);
  }
}

// Экспортируем все типы компонентов
export type Owner = components['schemas']['Owner'];
export type EventType = components['schemas']['EventType'];
export type Slot = components['schemas']['Slot'];
export type Booking = components['schemas']['Booking'];
export type BookingStatus = components['schemas']['BookingStatus'];
export type CreateEventTypeRequest = components['schemas']['CreateEventTypeRequest'];
export type UpdateEventTypeRequest = components['schemas']['UpdateEventTypeRequest'];
export type CreateBookingRequest = components['schemas']['CreateBookingRequest'];
export type CancelBookingRequest = components['schemas']['CancelBookingRequest'];
export type ErrorResponse = components['schemas']['ErrorResponse'];
export type NotFoundError = components['schemas']['NotFoundError'];
export type ValidationError = components['schemas']['ValidationError'];
export type SlotConflictError = components['schemas']['SlotConflictError'];
export type FieldError = components['schemas']['FieldError'];
