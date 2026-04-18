import { PublicApi, OwnerApi, EventTypesApi, SlotsApi } from '@calendar-booking/api-client';
import { ENV } from '@shared/config';

// Создаем единый инстанс API клиента
// В режиме mock использует VITE_API_URL=http://localhost:3100 (Prism)
export const apiClient = new PublicApi(ENV.API_URL);

// Клиенты для административных операций
export const ownerApiClient = new OwnerApi(ENV.API_URL);
export const eventTypesApiClient = new EventTypesApi(ENV.API_URL);
export const slotsApiClient = new SlotsApi(ENV.API_URL);
